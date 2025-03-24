import React, { useState, useEffect } from 'react'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
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

function App() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [savedTweets, setSavedTweets] = useState<SavedTweet[]>([])
  const [isSaving, setIsSaving] = useState(false)

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
    } catch (error) {
      console.error('Error saving tweet:', error)
    } finally {
      setIsSaving(false)
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
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
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
    <div className="min-h-screen p-6">
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 max-w-2xl">
          <h1 className="text-[2.5rem] font-bold mb-2 text-[#1f2937]">
            Content Remixer
          </h1>
          <p className="text-gray-700 mb-6">
            Transform your content with AI-powered remixing
          </p>
          
          <div className="mb-8">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your content here..."
              className="w-full h-32 p-2 border border-gray-300 rounded mb-4 resize-none"
            />
            
            <button
              onClick={handleRemix}
              disabled={isLoading || !inputText.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded font-medium"
            >
              {isLoading ? 'Remixing...' : 'Remix Content'}
            </button>
          </div>

          {outputText.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4 text-[#1f2937]">
                Generated Tweets:
              </h2>
              <div className="space-y-6">
                {outputText.map((tweet, index) => (
                  <div key={index} className="space-y-2">
                    <p className="text-gray-800">{tweet}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">{getCharactersRemaining(tweet)} characters remaining</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTweetShare(tweet)}
                          className="bg-white border border-gray-300 rounded px-3 py-1 hover:bg-gray-50"
                        >
                          Tweet
                        </button>
                        <button
                          onClick={() => handleSaveTweet(tweet)}
                          disabled={isSaving}
                          className="bg-green-500 text-white rounded px-3 py-1 hover:bg-green-600 disabled:bg-green-300"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Saved tweets sidebar */}
        <div className="w-80 bg-white border border-gray-200 rounded-lg p-4 h-[calc(100vh-3rem)] sticky top-6 overflow-y-auto">
          <h2 className="text-lg font-bold mb-4 text-[#1f2937]">Saved Tweets</h2>
          <div className="space-y-4">
            {savedTweets.map((tweet) => (
              <div key={tweet.id} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-800 mb-2">{tweet.content}</p>
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handleTweetShare(tweet.content)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Tweet
                  </button>
                  <button
                    onClick={() => handleDeleteSavedTweet(tweet.id)}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {savedTweets.length === 0 && (
              <p className="text-sm text-gray-500 text-center">No saved tweets yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
