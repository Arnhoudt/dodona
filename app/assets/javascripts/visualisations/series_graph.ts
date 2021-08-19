// eslint-disable-next-line
// @ts-nocheck
import * as d3 from "d3";

export type RawData = {
    // eslint-disable-next-line camelcase
    data: { ex_id: number, ex_data: unknown[] }[],
    exercises: [number, string][],
    students?: number
}

export abstract class SeriesGraph {
    // must be defined inside a class for I18n to work
    private d3Locale = {
        "dateTime": I18n.t("time.formats.default"),
        "date": I18n.t("date.formats.short"),
        "time": I18n.t("time.formats.short"),
        "periods": [I18n.t("time.am"), I18n.t("time.pm")],
        "days": I18n.t("date.day_names"),
        "shortDays": I18n.t("date.abbr_day_names"),
        "months": I18n.t("date.month_names").slice(1),
        "shortMonths": I18n.t("date.abbr_month_names").slice(1)
    };

    // settings
    protected readonly baseUrl!: string;
    protected readonly margin = { top: 20, right: 155, bottom: 40, left: 125 };
    protected readonly fontSize = 12;
    protected readonly darkMode: boolean;
    protected readonly width: number;
    protected height: number;
    protected innerWidth: number;
    protected innerHeight: number;

    // graph stuff
    protected readonly selector: string;
    protected readonly container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
    protected svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
    protected graph: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>

    // data
    private seriesId: string;
    protected exOrder: string[] = []; // array of exId's (in correct order)
    protected exMap: Record<string, string> = {}; // map from exId -> exName

    protected readonly longDateFormat = d3.timeFormat(I18n.t("date.formats.weekday_long"));

    /**
     * Initializes the container for the graph +
     * puts placeholder text when data isn't loaded +
     * starts data loading (and transforming) procedure
     * @param {string} seriesId The id of the series
     * @param {string} containerId the id of the html element in which the svg can be displayed
     * @param {Object} data The data used to draw the graph (unprocessed) (optional)
     */
    constructor(seriesId: string, containerId: string, data?: RawData) {
        this.seriesId = seriesId;
        this.selector = containerId;
        this.container = d3.select(this.selector);

        this.width = (this.container.node() as Element).getBoundingClientRect().width;
        this.darkMode = window.dodona.darkMode;

        d3.timeFormatDefaultLocale(this.d3Locale);
        if (data) {
            this.processData(data);
            this.draw();
        }
    }

    private getUrl(): string {
        return `/${I18n.locale}${this.baseUrl}${this.seriesId}`;
    }

    // abstract functions
    protected abstract processData(raw: RawData): void;


    protected draw(): void {
        console.log(this.exOrder);
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        this.svg = this.container
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this.graph = this.svg
            .append("g")
            .attr("transform",
                `translate(${this.margin.left}, ${this.margin.top})`);
    }

    /**
     * Breaks up y-axis labels into multiple lines when they get too long
     * @param {*} selection The selection of y-axis labels
     * @param {number} width     The width available to the labels
     * @param {[String, String]} exMap     An array of tuples [exId, exName] to link the two.
     */
    formatTitle(
        selection: d3.Selection<d3.BaseType, unknown, SVGGElement, unknown>,
        width: number, exMap: Record<string, string>
    ): void {
        selection.each((
            datum: string,
            i: number,
            nodeList: d3.BaseType | ArrayLike<d3.BaseType>
        ) => {
            const text = d3.select(nodeList[i]); // select label i

            // find exName corresponding to exId and split on space
            const words = exMap[datum].split(" ").reverse();
            let word = "";
            let line = [];
            let lineNumber = 0;
            const lineHeight = 1.1; // ems
            const y = text.attr("y"); // original y position (usually seems to be 'null')
            const dy = parseFloat(text.attr("dy")); // original y-shift
            let tspan = text.text(null)
                .append("tspan") // similar to html span
                .attr("x", 0)
                .attr("y", y)
                .attr("dy", `${dy}em`);
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                // check if the line fits in the allowed width
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop(); // if not remove last word
                    tspan.text(line.join(" "));
                    line = [word]; // start over with new line
                    tspan = text.append("tspan") // create new tspan for new line
                        .attr("x", -0)
                        .attr("y", y)
                        // new line starts a little lower than last one
                        .attr("dy", `${++lineNumber * lineHeight + dy}em`)
                        .text(word)
                        .attr("text-anchor", "end");
                }
            }
            const fontSize = parseInt(tspan.style("font-size"));
            const tSpans = text.selectAll("tspan");
            const breaks = tSpans.size(); // amount of times the name has been split
            // final y position adjustment so everything is centered
            tSpans.attr("y", -fontSize * (breaks - 1) / 2);
        });
    }

    /**
     * Converts the tuples of exercises into an list of ids indicating the order
     * and a map form id to title
     * ids from the list are only added if they appear in the data
     * @param {[string, string][]} exercises The list of exercise tuples [id, title]
     * @param {string} keys The ids present in the data
     */
    protected parseExercises(exercises: [number, string][], keys: number[]): void {
        exercises.forEach(([id, title]) => {
            // only add if the key is present in the data
            if (keys.indexOf(id) >= 0) {
                this.exOrder.push(String(id));
                this.exMap[id] = title;
            }
        });
    }

    /**
     * Displays an error message when there is not enough data
    */
    protected drawNoData(): void {
        this.container
            .style("height", "50px")
            .append("div")
            .text(I18n.t("js.no_data"))
            .attr("class", "graph_placeholder");
    }

    /**
     * Fetched the data from specified url
     * If the data has a 'not available' status, wait a second and fetch again
     * @param {string} url The url from which to fetch the data from
     * @param {Object} raw The return value of the fetch
     *  used to check if the data should be fetched again
     */
    protected async fetchData(): Promise<RawData> {
        const url = this.getUrl();
        let raw: RawData = undefined;
        while (!raw || raw["status"] == "not available yet") {
            raw = await d3.json(url);
            if (raw["status"] == "not available yet") {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return raw as RawData;
    }

    /**
     * Fetches and processes data
     * @param {boolean} doDraw When false, the graph will not be drawn
     * (only data fetching and processing)
     */
    async init(doDraw = true): Promise<void> {
        // add loading placeholder
        const tempHeight = this.container.node().getBoundingClientRect().height;
        this.container.html("");
        this.container
            .append("div")
            .text(I18n.t("js.loading"))
            .attr("class", "graph_placeholder")
            .style("height", `${tempHeight}px`)
            .style("min-height", "100px")
            .style("display", "flex")
            .style("align-items", "center");

        // fetch data
        const r: RawData = await this.fetchData();
        // once fetched remove placeholder
        this.container.html("");

        if (r.data.length === 0) {
            this.drawNoData();
        }
        // next process the data
        this.processData(r);
        if (doDraw) {
            // next draw the graph
            this.draw();
        }
    }
}
