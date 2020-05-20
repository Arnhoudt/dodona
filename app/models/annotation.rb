# == Schema Information
#
# Table name: annotations
#
#  id                :bigint           not null, primary key
#  line_nr           :integer
#  submission_id     :integer
#  user_id           :integer
#  annotation_text   :text(65535)
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#  review_session_id :bigint
#
class Annotation < ApplicationRecord
  include ApplicationHelper

  belongs_to :submission
  belongs_to :user
  belongs_to :review_session, optional: true

  validates :user, presence: true
  validates :annotation_text, presence: true, length: { minimum: 1, maximum: 2048 }
  validates :line_nr, allow_nil: true, numericality: {
    greater_than_or_equal_to: 0
  }, if: ->(attr) { attr.line_nr.present? }

  scope :by_submission, ->(submission_id) { where(submission_id: submission_id) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :released, -> { where(review_session_id: nil).or(where(review_sessions: { released: true })) }

  after_save :create_notification
  after_destroy :destroy_notification

  private

  def create_notification
    return if review_session.present?

    Notification.find_by(notifiable: submission)&.destroy
    Notification.create(notifiable: submission, user: submission.user, message: 'annotations.index.new_annotation')
  end

  def destroy_notification
    Notification.find_by(notifiable: submission)&.destroy unless submission.annotations.left_joins(:review_session).released.any?
  end
end
