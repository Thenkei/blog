import { useEffect, useState } from 'react'
import './index.css'

const POSTS = [
  {
    id: 'coros-apex-4',
    date: 'January 14, 2026',
    readTime: '6 min read',
    title: 'From Smart to Sport: Why I Traded My Apple Watch for the COROS APEX 4',
    subtitle: 'Preparing for 100k of dirt, sweat, and data.',
    content: (
      <>
        <p>I’ve always been a bit of a "running minimalist," or at least I liked to tell myself that. There’s a certain zen in running "naked"—no watch, no music, just the sound of your own heavy breathing and the occasional judgment from a passing squirrel. But then I signed up for a 100k UTMB trail race.</p>
        
        <p>Suddenly, "feeling the pace" felt a lot like "getting lost in the Alps at 3 AM." I needed data. I needed battery. And most importantly, I needed a watch that didn't die before I finished my morning coffee.</p>

        <p>For years, my <strong>Apple Watch SE (1st Gen)</strong> was my faithful companion. It told me when I had emails (stressful), it tracked my steps to the fridge (impressive), and it looked sleek at the office. But as my training ramped up to 4 trails a week, the "low battery" chime became the soundtrack of my life. Entering a 15-hour race with a watch that gets nervous after 4 hours of GPS is like bringing a spoon to a knife fight. A very shiny, expensive spoon.</p>

        <h2>Enter the COROS APEX 4</h2>
        <p>Switching to the <strong>COROS APEX 4</strong> felt like moving from a luxury sedan to a rugged mountain jeep. It’s built with a titanium bezel and sapphire glass, which is great because I tend to "interact" with rocks more often than I’d like to admit. But the real game-changer? The battery.</p>
        
        <p className="highlight">
          The APEX 4 doesn't just have a battery; it has a philosophy.
        </p>

        <p>In its new <em>Endurance</em> mode (which optimizes GNSS selection), this thing can outlast my willpower. For my 100k prep, I’ll be out there for 13 to 15 hours. The Apple Watch would have retired, moved to Florida, and started playing bridge by hour six. The COROS? It’ll still be asking me if I want to go for another lap.</p>

        <h2>Data that Actually Helps (Not Just High Scores)</h2>
        <p>One thing I’ve had to accept: data helps you stay uninjured. The COROS ecosystem provides 6-month training plans that evolve at your own pace. As a Staff Engineer, I appreciate a good algorithm, and watching my <em>Training Load</em> and <em>VFC (Heart Rate Variability)</em> has kept me from nuking my legs when I should be resting.</p>
        
        <p>It also added a speaker and a microphone, which is funny because now the watch can technically tell me to "slow down" out loud. It’s like having a very calm, very persistent coach living on my wrist.</p>

        <h2>The "Smart" vs. "Sport" Divide</h2>
        <p>Is the Apple Watch "better"? It depends on what you value. If you want to pay for groceries with your wrist and reply to texts while doing 800m repeats (why?), stay with Apple. But if you’re staring down 100km of vertical gain and you want a tool that treats your training with the same seriousness as your IDE treats a production bug, the APEX 4 is in a different league.</p>

        <p>The charger? I think I left it in a drawer somewhere. I haven't needed it in two weeks. And for a runner preparing for the biggest race of their life, that peace of mind is worth every gram of titanium.</p>
      </>
    )
  },
  {
    id: 'ai-force-multiplier',
    date: 'January 10, 2026',
    readTime: '8 min read',
    title: 'The Force Multiplier: AI as the New Engineering Substrate',
    subtitle: 'From execution to orchestration.',
    content: (
      <>
        
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
      </>
    )
  },
  {
    id: 'joining-rockfi',
    date: 'December 1, 2025',
    readTime: '3 min read',
    title: 'New Chapter: Joining RockFi as Staff Back-end Engineer',
    subtitle: 'Structuring the tech capable of revolutionizing private wealth management.',
    content: (
      <>
        <p>I am thrilled to announce my arrival at <strong>RockFi</strong> to strengthen the tech team! It marks a significant new step in my career, and I couldn't be more excited about the challenges ahead.</p>

        <h2>A Look Back</h2>
        <p>My career began in the startup world at <strong>Polymagine</strong>, where I dedicated myself to R&D for additive manufacturing and augmented reality visualization. I then moved to <strong>Michelin</strong>, contributing to IT projects serving industrial production.</p>
        
        <p>In 2021, I joined <strong>Forest Admin</strong>, where I spent four years evolving from Full Stack Engineer to Staff Engineer and leading a tech team as Engineering Manager. During this time, I played a key role in structuring and growing the team, helping it double in size to reach over 20 engineers.</p>

        <h2>The Mission at RockFi</h2>
        <p>At RockFi, my focus will be on the <strong>interconnection with key partners</strong>. The goal is to centralize client data and enable real-time visualization of asset portfolios. It's a technical challenge that sits right at the intersection of complex data integration and user-centric product value.</p>
        
        <p className="highlight">
          "I have the ambition to help structure a technical team capable of responding to the challenges demanded by the revolution of 'The new private management'."
        </p>
        
        <p>RockFi is tackling "The new private wealth management," and building the robust technical foundation to support that vision is exactly where I want to be. 🚀</p>
      </>
    )
  },
]

function App() {
  const [scrollY, setScrollY] = useState(0)
  const [currentPostId, setCurrentPostId] = useState(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getStyle = (speed, offset = 0) => ({
    transform: `translateY(${scrollY * speed + offset}px)`
  })

  const currentPost = POSTS.find(p => p.id === currentPostId)

  return (
    <div className="app">
      <div className="circuit-overlay"></div>
      
      <section className="parallax-container">
        <div className="parallax-layer layer-mountain-1" style={getStyle(0.2)}></div>
        <div className="parallax-layer layer-mountain-2" style={getStyle(0.4)}></div>
        <div className="parallax-layer layer-mountain-3" style={getStyle(0.8, 50)}></div>
        
        <div className="hero-content">
          <h1 className="hero-title" onClick={() => {setCurrentPostId(null); window.scrollTo(0,0)}} style={{cursor: 'pointer'}}>
            Morgan's Blog
          </h1>
          <p className="hero-subtitle">Engineering / Running / Evolution</p>
        </div>
      </section>

      <main className="blog-content">
        <div className="container">
          {!currentPost ? (
            <div className="post-list">
              <h2 style={{marginTop: 0, marginBottom: '3rem'}}>Latest Posts</h2>
              {POSTS.map(post => (
                <div key={post.id} className="post-card" onClick={() => {setCurrentPostId(post.id); window.scrollTo(0, window.innerHeight * 0.8)}}>
                  <div className="meta">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p style={{color: 'var(--text-secondary)'}}>{post.subtitle}</p>
                  <div className="trail-line" style={{width: '50px', margin: '1rem 0'}}></div>
                </div>
              ))}
            </div>
          ) : (
            <article>
              <button className="back-btn" onClick={() => setCurrentPostId(null)}>← Back to home</button>
              <div className="meta">
                <span>{currentPost.date}</span>
                <span>•</span>
                <span>{currentPost.readTime}</span>
              </div>
              
              <h1 style={{ fontSize: '3.5rem', marginBottom: '2rem', lineHeight: '1.1' }}>
                {currentPost.title}
              </h1>
              
              <div className="trail-line"></div>

              {currentPost.content}

              <div className="trail-line" style={{ marginTop: '4rem' }}></div>
              <button className="back-btn" onClick={() => {setCurrentPostId(null); window.scrollTo(0,0)}}>← Back to home</button>
            </article>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
