import { useTranslation } from "react-i18next";
import { PageMeta } from "../../shared/seo/PageMeta";

const socialLinks = [
  { key: "github", href: "https://github.com/Thenkei" },
  { key: "linkedin", href: "https://www.linkedin.com/in/morgan-perre-15295782" },
] as const;

export function AboutPage({ locale }: { locale: "en" | "fr" }) {
  const { t } = useTranslation();
  const projects = t("about.projects", { returnObjects: true }) as Array<{ title: string; description: string }>;

  return (
    <main className="blog-content">
      <div className="container about-page">
        <PageMeta title={t("about.title")} description={t("about.summary")} path={`/${locale}/about`} type="website" />
        <p className="section-eyebrow">{t("ui.about")}</p>
        <h1>{t("about.title")}</h1>
        <p className="about-summary">{t("about.summary")}</p>
        <section className="about-section"><h2>{t("about.currentFocus")}</h2><p>{t("about.currentFocusText")}</p></section>
        <section className="about-section"><h2>{t("about.selectedProjects")}</h2><div className="about-project-grid">{projects.map((project) => <article key={project.title} className="about-project"><h3>{project.title}</h3><p>{project.description}</p></article>)}</div></section>
        <section className="about-section"><h2>{t("about.findMe")}</h2><div className="about-social-links">{socialLinks.map((link) => <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer">{t(`ui.footer.${link.key}`)}</a>)}</div></section>
      </div>
    </main>
  );
}
