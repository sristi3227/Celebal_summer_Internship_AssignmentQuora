import VoteButtons from "./VoteButtons"
import "./AnswerCard.css"

function AnswerCard({ answer }) {
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date"
    return new Date(timestamp.toDate()).toLocaleDateString()
  }

  return (
    <div className="answer-card">
      <div className="answer-votes">
        <VoteButtons
          itemId={answer.id}
          itemType="answers"
          initialUpvotes={answer.upvotes || 0}
          initialDownvotes={answer.downvotes || 0}
        />
      </div>

      <div className="answer-content">
        <div className="answer-text">
          <p>{answer.content}</p>
        </div>

        <div className="answer-footer">
          <div className="answer-meta">
            <span>answered by {answer.authorName}</span>
            <span>•</span>
            <span>{formatDate(answer.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnswerCard
