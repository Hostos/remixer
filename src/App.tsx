import React, { useState, useEffect } from 'react'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { env } from './utils/env'

// Initialize Supabase client
const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY
)

interface SavedTweet {
  id: number
  content: string
  created_at: string
}

const SYSTEM_PROMPT = `You are a social media expert and ghostwriter.

You work for a popular blogger, and your job is to take their blog post and come up with a variety of tweets to share ideas from the post.

Since you are a ghostwriter, you need to make sure to follow the style, tone, and voice of the blog post as closely as possible.

Remember: Tweets cannot be longer than 280 characters.

Format your response as follows:
1. Each tweet must start with a number followed by a period and a space (e.g. "1. ")
2. Each tweet must be separated by "---" on its own line
3. Do not use any hashtags or emojis
4. Generate at least 5 tweets
5. Do not include any introductory text, just start with the tweets

Here is the blog post:`

// Basic styles as plain JavaScript objects to avoid Tailwind dependency issues
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    position: 'relative' as const
  },
  mainContent: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    transition: 'all 0.3s ease'
  },
  mainContentWithSidebar: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    marginRight: '320px',
    transition: 'all 0.3s ease'
  },
  sidebar: {
    width: '300px',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    position: 'fixed' as const,
    right: '0',
    top: '0',
    height: '100%',
    overflowY: 'auto' as const,
    zIndex: 1000
  },
  header: {
    backgroundColor: '#1DA1F2',
    color: 'white',
    padding: '10px',
    marginBottom: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textAlign: 'center' as const
  },
  inputArea: {
    marginBottom: '20px'
  },
  textarea: {
    width: '100%',
    height: '150px',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px'
  },
  editTextarea: {
    width: '100%',
    height: '80px',
    padding: '8px',
    marginBottom: '8px',
    border: '1px solid #1DA1F2',
    borderRadius: '4px',
    fontSize: '14px'
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
    gap: '10px'
  },
  primaryButton: {
    backgroundColor: '#1DA1F2',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    minWidth: '140px'
  },
  secondaryButton: {
    backgroundColor: 'white',
    color: '#1DA1F2',
    border: '1px solid #1DA1F2',
    padding: '10px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    minWidth: '140px'
  },
  tweetCard: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e1e4e8',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '15px'
  },
  tweetContent: {
    marginBottom: '10px'
  },
  tweetActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  tweetButton: {
    backgroundColor: '#1DA1F2',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  saveButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  editButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  characterCount: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    backgroundColor: '#e2e3e5',
    color: '#383d41'
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center' as const,
    color: '#6c757d',
    fontSize: '14px'
  },
  editButtonsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
    gap: '5px'
  }
};

function App() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [savedTweets, setSavedTweets] = useState<SavedTweet[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editTweetId, setEditTweetId] = useState<number | null>(null)
  const [editTweetContent, setEditTweetContent] = useState('')

  // Fetch saved tweets on component mount
  useEffect(() => {
    fetchSavedTweets()
  }, [])

  const fetchSavedTweets = async () => {
    const { data, error } = await supabase
      .from('saved_tweets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved tweets:', error)
      return
    }

    setSavedTweets(data || [])
  }

  const handleSaveTweet = async (tweet: string) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('saved_tweets')
        .insert([{ content: tweet }])

      if (error) throw error

      // Refresh the saved tweets list
      await fetchSavedTweets()
      // Open sidebar to show newly saved tweet
      setSidebarOpen(true)
    } catch (error) {
      console.error('Error saving tweet:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditTweet = (tweet: SavedTweet) => {
    setEditTweetId(tweet.id)
    setEditTweetContent(tweet.content)
  }

  const handleCancelEdit = () => {
    setEditTweetId(null)
    setEditTweetContent('')
  }

  const handleUpdateTweet = async () => {
    if (!editTweetId) return
    
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('saved_tweets')
        .update({ content: editTweetContent })
        .eq('id', editTweetId)

      if (error) throw error

      // Refresh the saved tweets list
      await fetchSavedTweets()
      // Exit edit mode
      setEditTweetId(null)
      setEditTweetContent('')
    } catch (error) {
      console.error('Error updating tweet:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteSavedTweet = async (id: number) => {
    try {
      const { error } = await supabase
        .from('saved_tweets')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh the saved tweets list
      await fetchSavedTweets()
    } catch (error) {
      console.error('Error deleting tweet:', error)
    }
  }

  const handleRemix = async () => {
    if (!inputText.trim()) return
    
    setIsLoading(true)
    try {
      const openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      })

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },
          {
            role: "user",
            content: inputText
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })

      const remixedContent = response.choices[0]?.message?.content
      if (remixedContent) {
        // Split content by the separator and clean up each tweet
        const tweets = remixedContent
          .split('---')
          .map(tweet => tweet.trim())
          .filter(tweet => tweet.length > 0)
        setOutputText(tweets)
      } else {
        setOutputText(['Received unexpected response format from OpenAI.'])
      }
    } catch (error) {
      console.error('Error:', error)
      setOutputText(['An error occurred while remixing the text. Please make sure your API key is set correctly.'])
    } finally {
      setIsLoading(false)
    }
  }

  const handleTweetShare = (tweet: string) => {
    const tweetText = encodeURIComponent(tweet)
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank')
  }

  const getCharactersRemaining = (tweet: string) => {
    return 280 - tweet.length
  }

  return (
    <div style={styles.container}>
      {/* Main content */}
      <div style={sidebarOpen ? styles.mainContentWithSidebar : styles.mainContent}>
        <h1 style={styles.title}>Content Remixer</h1>
        <p style={{ textAlign: 'center', marginBottom: '20px' }}>Transform your blog posts into engaging tweets</p>
        
        {/* Input area */}
        <div style={styles.inputArea}>
          <textarea 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your content here..."
            style={styles.textarea}
          />
          <div style={styles.buttonRow}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={styles.secondaryButton}
            >
              {sidebarOpen ? "Hide Saved Tweets" : "Show Saved Tweets"}
            </button>
            <button
              onClick={handleRemix}
              disabled={isLoading}
              style={styles.primaryButton}
            >
              {isLoading ? "Generating..." : "Generate Tweets"}
            </button>
          </div>
        </div>
        
        {/* Generated Tweets section */}
        {outputText.length > 0 && (
          <div>
            <h2 style={{ ...styles.title, fontSize: '20px' }}>Generated Tweets</h2>
            <div>
              {outputText.map((tweet, index) => (
                <div key={index} style={styles.tweetCard}>
                  <p style={styles.tweetContent}>{tweet}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={styles.characterCount}>
                      {getCharactersRemaining(tweet)} characters remaining
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleSaveTweet(tweet)}
                        disabled={isSaving}
                        style={styles.saveButton}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => handleTweetShare(tweet)}
                        style={styles.tweetButton}
                      >
                        Tweet
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div style={styles.footer}>
          <p>Content Remixer - Made with ♥</p>
        </div>
      </div>

      {/* Saved Tweets Sidebar */}
      {sidebarOpen && (
        <div style={styles.sidebar}>
          <div style={styles.header}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>Saved Tweets</h2>
            <button 
              onClick={() => setSidebarOpen(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
          
          <div>
            {savedTweets.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic', marginTop: '20px' }}>No saved tweets yet</p>
            ) : (
              <div>
                {savedTweets.map((tweet) => (
                  <div key={tweet.id} style={{ ...styles.tweetCard, padding: '10px', marginBottom: '10px' }}>
                    {editTweetId === tweet.id ? (
                      <>
                        <textarea
                          value={editTweetContent}
                          onChange={(e) => setEditTweetContent(e.target.value)}
                          style={styles.editTextarea}
                        />
                        <div style={{ textAlign: 'right', fontSize: '12px', marginBottom: '8px' }}>
                          {getCharactersRemaining(editTweetContent)} characters remaining
                        </div>
                        <div style={styles.editButtonsRow}>
                          <button
                            onClick={handleCancelEdit}
                            style={{ ...styles.deleteButton, fontSize: '12px' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUpdateTweet}
                            disabled={isUpdating}
                            style={{ ...styles.editButton, fontSize: '12px' }}
                          >
                            {isUpdating ? "Saving..." : "Update"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p style={{ ...styles.tweetContent, fontSize: '14px' }}>{tweet.content}</p>
                        <div style={styles.tweetActions}>
                          <button
                            onClick={() => handleEditTweet(tweet)}
                            style={{ ...styles.editButton, fontSize: '12px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleTweetShare(tweet.content)}
                            style={{ ...styles.tweetButton, fontSize: '12px' }}
                          >
                            Tweet
                          </button>
                          <button
                            onClick={() => handleDeleteSavedTweet(tweet.id)}
                            style={{ ...styles.deleteButton, fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
