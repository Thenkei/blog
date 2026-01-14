import { useEffect, useState } from 'react'
import './index.css'

function App() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getStyle = (speed) => ({
    transform: `translateY(${scrollY * speed}px)`
  })

  return (
    <div className="app">
      <div className="circuit-overlay"></div>
      
      <section className="parallax-container">
        <div className="parallax-layer layer-mountain-1" style={getStyle(0.2)}></div>
        <div className="parallax-layer layer-mountain-2" style={getStyle(0.4)}></div>
        <div className="parallax-layer layer-mountain-3" style={getStyle(0.6)}></div>
        
        <div className="hero-content">
          <h1 className="hero-title">Morgan's Blog</h1>
          <p className="hero-subtitle">Engineering / Running / Evolution</p>
        </div>
      </section>

      <main className="blog-content">
        <div className="container">
          <article>
            <div className="meta">
              <span>January 14, 2026</span>
              <span>•</span>
              <span>8 min read</span>
            </div>
            
            <h1 style={{ fontSize: '3.5rem', marginBottom: '2rem', lineHeight: '1.1' }}>
              The Force Multiplier: AI as the New Engineering Substrate
            </h1>
            
            <div className="trail-line"></div>

            <p>
              As a runner, I know that the terrain dictates the pace. On a technical single-track, your focus narrows to the immediate root or rock. On a flat asphalt stretch, you find rhythm. In software engineering, the terrain just shifted overnight. AI isn't just a new tool; it's a new topography.
            </p>

            <p>
              For a Staff Engineer, the value proposition has long been about <strong>judgment</strong> over raw output speed. But when raw output speed becomes effectively infinite through LLMs, the premium on judgment doubles. I’ve spent the last few months integrating AI into every facet of my workflow—from drafting RFCs to deep-dive refactors—and the shift is profound.
            </p>

            <h2>From Execution to Orchestration</h2>
            <p>
              The most visible change is where my time goes. In the "Before Times," a significant chunk of my mental energy was spent on the <em>mechanics</em> of coding: syntax, boilerplate, API lookups. Now, I spend about 20% of my time executing and 80% <strong>orchestrating</strong>.
            </p>
            
            <p className="highlight">
              Think of AI as a junior engineer with 100x speed but zero context.
            </p>

            <p>
              I use AI for "exploratory drafting." If I’m considering a new architecture for our event-driven systems, I’ll ask the model to scaffold three different approaches. It’s not about using the code it generates directly; it’s about using it to <strong>collapse the search space</strong> of possibilities. I can "see" three different futures in seconds, then apply my years of maintaining production systems to pick the one that won't bite us in 18 months.
            </p>

            <h2>The Erosion of Fundamentals?</h2>
            <p>
              There is a valid fear that relying on AI will erode our foundational skills. If you don't learn how to debug a stack trace because the AI fixes it for you, are you still an engineer?
            </p>
            
            <p>
              I believe we are seeing a shift in what "fundamentals" means. Coding is becoming less about memorizing the standard library and more about <strong>intent-clarity</strong> and <strong>verification</strong>. If you can't describe the problem precisely, the AI will confidently hallucinate an answer. The new fundamental is the ability to audit AI output with the same skepticism you'd bring to a PR from a stranger.
            </p>

            <h2>Practical Principles for the AI Era</h2>
            <p>
              How do we adapt without losing our edge? Here are my personal guardrails:
            </p>
            <ul>
              <li><code className="highlight">Verify, then Trust:</code> Never commit code you haven't read line-by-line. If you can't explain why a line is there, you're not done.</li>
              <li><code className="highlight">Prompt for Rationale:</code> Ask the AI <em>why</em> it chose a specific pattern. It forces the model (and you) to think through trade-offs.</li>
              <li><code className="highlight">Maintain the "Mental Model":</code> Use AI to build, but keep the architecture in your head. The day you stop understanding how your system fits together is the day you start being replaced.</li>
            </ul>

            <p>
              Running a mountain trail requires both agility and endurance. You need the speed to clear the technical sections, but the lung capacity to finish the 50k. AI gives us the speed, but we still need to provide the endurance—the long-term vision and the human judgment that keeps the system running mile after mile.
            </p>

            <div className="trail-line" style={{ marginTop: '4rem' }}></div>
          </article>
        </div>
      </main>
    </div>
  )
}

export default App
