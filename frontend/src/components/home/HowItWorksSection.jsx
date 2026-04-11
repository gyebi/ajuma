import { productPillars } from "../../content/homepage";

export default function HowItWorksSection() {
  return (
    <section className="product-section" id="how-it-works">
      <div className="product-heading">
        <p className="section-label section-label-product">Product</p>
        <h2>A simple workflow for turning background into direction.</h2>
        <p className="product-intro">
          Ajuma brings the most important parts of the job-search journey into one
          guided flow, so people can spend less time piecing things together on their own.
        </p>
      </div>

      <div className="product-layout">
        <div className="product-showcase">
          <div className="product-window">
            <div className="window-bar">
              <span />
              <span />
              <span />
            </div>

            <div className="workflow-stack">
              <div className="workflow-card">
                <p className="workflow-label">Step 1</p>
                <h3>Share your background</h3>
                <p>Start with a resume or a few details about your experience, goals, and strengths.</p>
              </div>

              <div className="workflow-card workflow-card-accent">
                <p className="workflow-label">Step 2</p>
                <h3>Shape your profile</h3>
                <p>Ajuma helps turn that input into a profile that feels clearer, stronger, and easier to present.</p>
              </div>

              <div className="workflow-card">
                <p className="workflow-label">Step 3</p>
                <h3>Move toward better matches</h3>
                <p>Use that stronger foundation to focus your search on roles that make more sense for you.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="product-pillar-list">
          {productPillars.map((pillar) => (
            <article className="product-pillar" key={pillar.title}>
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
