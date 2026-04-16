export default function FavoriteJobs({
  favoriteJobs,
  onApply,
  onBack,
  onRemoveFavorite
}) {
  return (
    <section className="app-panel">
      <div className="app-panel-header">
        <p className="section-label section-label-jobs">My Favorites</p>
        <h1 className="app-title">Keep your strongest job matches close.</h1>
        <p className="app-subtitle">
          Jobs you favorite from the matched jobs list will stay here so you can
          review and apply when you are ready.
        </p>
      </div>

      <div className="profile-actions">
        <button className="button button-secondary" type="button" onClick={onBack}>
          Back
        </button>
      </div>

      <div className="jobs-grid">
        {favoriteJobs.length ? (
          favoriteJobs.map((job) => (
            <article className="job-card" key={job.id}>
              <div className="job-card-header">
                <span className="profile-meta-label">Favorite Role</span>
                <button
                  className="favorite-button favorite-button-active"
                  type="button"
                  onClick={() => onRemoveFavorite(job)}
                  aria-label={`Remove ${job.title} from favorites`}
                >
                  <span aria-hidden="true">♥</span>
                </button>
              </div>

              <h3>{job.title}</h3>
              <p>{job.company}</p>
              {job.location ? <p>{job.location}</p> : null}
              {typeof job.matchScore === "number" ? (
                <p><strong>Match Score:</strong> {job.matchScore}/100</p>
              ) : null}
              {Array.isArray(job.matchReasons) && job.matchReasons.length ? (
                <p>{job.matchReasons.join(" • ")}</p>
              ) : null}

              <div className="job-card-actions">
                <button className="button button-secondary" type="button" onClick={() => onRemoveFavorite(job)}>
                  Remove
                </button>
                <button className="button button-primary" type="button" onClick={() => onApply(job)}>
                  Apply
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="job-card job-card-empty">
            <span className="profile-meta-label">No Favorites Yet</span>
            <h3>Your favorite jobs will appear here.</h3>
            <p>Use the heart icon on any matched job to save it to this page.</p>
          </div>
        )}
      </div>
    </section>
  );
}
