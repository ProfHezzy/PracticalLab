import Link from "next/link";
import { StatusPanel } from "@practicallab/ui";
import { AccountLinks } from "@/components/account-links";
import { ThemeToggle } from "@/components/theme-toggle";

const subjects = [
  {
    name: "Chemistry",
    color: "chemistry",
    description: "Mix, separate and discover.",
  },
  {
    name: "Basic Electronics",
    color: "electronics",
    description: "Build circuits that light up.",
  },
];

export default function HomePage() {
  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="PracticalLab Africa home">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>
            PracticalLab <strong>Africa</strong>
          </span>
        </Link>
        <nav className="header-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#subjects">Subjects</a>
          <Link className="button button-secondary" href="/teacher">
            I&apos;m a teacher
          </Link>
        </nav>
        <AccountLinks />
        <ThemeToggle />
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">YOUR LAB, IN YOUR POCKET</p>
            <h1 id="hero-title">
              Don&apos;t just read it. <span>Do it.</span>
            </h1>
            <p className="hero-description">
              Mix, wire, build and test practical experiments on your phone,
              even when data is low.
            </p>
            <div className="hero-actions">
              <Link className="button button-reward" href="/auth/register">
                Create your free account
              </Link>
              <Link className="button button-quiet" href="/auth/login">
                I already have an account
              </Link>
            </div>
            <p className="hero-note">
              Free to explore · Made for curious minds
            </p>
          </div>
          <div
            className="hero-art"
            aria-label="A friendly flask ready for an experiment"
          >
            <span className="orbit orbit-one" aria-hidden="true" />
            <span className="orbit orbit-two" aria-hidden="true" />
            <div className="flask" aria-hidden="true">
              <span className="flask-neck" />
              <span className="flask-liquid" />
              <span className="flask-eye eye-left" />
              <span className="flask-eye eye-right" />
              <span className="flask-smile" />
            </div>
            <span className="float-chip chip-chem">Chemistry</span>
            <span className="float-chip chip-circuit">Circuits</span>
            <span className="sparkle sparkle-one" aria-hidden="true">
              ✦
            </span>
            <span className="sparkle sparkle-two" aria-hidden="true">
              ✦
            </span>
          </div>
        </section>

        <section className="section intro-section" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">LEARN BY DOING</p>
            <h2>Big practical energy. Right where you are.</h2>
            <p>
              Follow a lesson, try the experiment yourself, and learn from every
              little “oops”.
            </p>
          </div>
          <ol className="steps-list">
            <li>
              <span className="step-number">01</span>
              <strong>Pick a topic</strong>
              <span>Find what you are learning in class.</span>
            </li>
            <li>
              <span className="step-number">02</span>
              <strong>Watch it</strong>
              <span>See the practical come to life.</span>
            </li>
            <li>
              <span className="step-number">03</span>
              <strong>Do it</strong>
              <span>Try the steps in your own lab.</span>
            </li>
            <li>
              <span className="step-number">04</span>
              <strong>Learn more</strong>
              <span>Try again, share or ask your teacher.</span>
            </li>
          </ol>
        </section>

        <section className="section subjects-section" id="subjects">
          <div className="section-heading section-heading-row">
            <div>
              <p className="eyebrow">START WITH THE BASICS</p>
              <h2>Choose your first lab</h2>
            </div>
            <Link className="button button-primary" href="/content">
              Browse reviewed lessons
            </Link>
          </div>
          <div className="subject-grid">
            {subjects.map((subject) => (
              <article
                className={`subject-card subject-${subject.color}`}
                key={subject.name}
              >
                <span className="subject-icon" aria-hidden="true">
                  {subject.color === "chemistry" ? "✦" : "ϟ"}
                </span>
                <h3>{subject.name}</h3>
                <p>{subject.description}</p>
                <span className="subject-status">Coming soon</span>
              </article>
            ))}
          </div>
        </section>

        <section className="teacher-callout">
          <div>
            <p className="eyebrow">FOR TEACHERS</p>
            <h2>Bring the practical to the whole class.</h2>
            <p>
              Explore a teacher-led demo on your own screen, then set practical
              work for your learners.
            </p>
          </div>
          <Link className="button button-light" href="/teacher">
            Meet the teacher lab
          </Link>
        </section>

        <section
          className="section shell-status"
          aria-label="Platform status examples"
        >
          <StatusPanel
            kind="empty"
            title="Your lab is getting ready"
            message="Reviewed practicals will appear here as they are added."
          />
        </section>
      </main>

      <footer className="site-footer">
        <p>© Hezekiah Olawale Ojenike / MINDSET INFORMATION TECHNOLOGY LTD.</p>
        <Link href="/teacher">Teacher information</Link>
      </footer>
    </>
  );
}
