class TutorController < ApplicationController

    DATA_DIR = Rails.root.join('tmp', 'tutor').freeze

    def index
    end

    def show
        submission = Submission.find(params[:submission_id])
        authorize submission

        file = File.join(DATA_DIR, params[:submission_id] + '-' + params[:id])
        f = File.new(file, "w")
        f.write(submission.code)
        f.write("\n")
        f.write("echo('I am Dieter')")
        f.close
        @codefile = file
        render


        File.delete(file)
    end
end