ExceptionNotifier.add_notifier :event_logger, ->(e, options) {
  Event.create(event_type: :error, user: Current.user, message: e.message)
}

ActiveSupport::Notifications.subscribe "process_action.action_controller" do |name, start, finish, id, payload|
  if finish - start > 10.seconds
    headers = payload.delete :headers
    ExceptionNotifier.notify_exception(
      Exception.new("A request took #{finish - start} seconds"),
      env: headers.env,
      data: payload
    )
  end
end
