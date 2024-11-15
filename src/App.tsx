import { useState, useEffect, MouseEvent } from 'react'
import * as webllm from "@mlc-ai/web-llm";
import './App.css'
import LoadingOverlay from './components/LoadingOverlay';
import { LoadingState } from './types';
import Markdown from 'react-markdown';

// Other models: https://github.com/mlc-ai/web-llm/blob/1d04fe7d4a62febf512b4b3dad4643402c7ff24a/src/config.ts#L1644
const SELECTED_MODEL = "Llama-3-8B-Instruct-q4f32_1-MLC";

const responseCache = new Map<string, string>();

const getCachedResponse = (prompt: string) => {
  return responseCache.get(prompt);
};

const setCachedResponse = (prompt: string, response: string) => {
  responseCache.set(prompt, response);
};

function App() {
  const [engine, setEngine] = useState<webllm.MLCEngine | null>(null);
  const [text, setText] = useState<string>("")
  const [loadingInfo, setLoadingInfo] = useState<LoadingState>({
    isLoading: false,
    loading: ""
  })
  const [messages, setMessages] = useState<Array<webllm.ChatCompletionMessageParam>>([
    { role: "system", content: "You are a helpful AI assistant that returns responses in markdown format." },
  ])

  useEffect(() => {
    async function initEngine() {
      setLoadingInfo({ isLoading: true, loading: "Initializing engine..." });
      const newEngine = await webllm.CreateMLCEngine(SELECTED_MODEL, {
        initProgressCallback: (initProgress: webllm.InitProgressReport) => {
          console.log(initProgress);
          setText(initProgress.text.split(":")[0]);
        }
      });
      setEngine(newEngine);
      setLoadingInfo({ isLoading: false, loading: "" });
    }
    initEngine();
  }, []);
  
  useEffect(() => {
    async function chat() {
      if (!engine) {
        setText("Engine not initialized");
        return;
      }
      setLoadingInfo({ isLoading: true, loading: "Generating response..." });
      const lastMessage = messages[messages.length-1];
      const cachedResponse = getCachedResponse(lastMessage.content as string);
      if (cachedResponse) {
        setMessages(messages => [...messages, { role: "assistant", content: cachedResponse }])
        return;
      }

      // Non-streaming
      // const data: webllm.ChatCompletionRequestNonStreaming = { messages }
      const data: webllm.ChatCompletionRequestStreaming = {
        messages,
        stream: true
      }

      setMessages(messages => [...messages, { role: "assistant", content: "" }])
      
      const chunks = await engine.chat.completions.create(data)
      setLoadingInfo({ isLoading: false, loading: "" });
      for await (const chunk of chunks) {
        const text = chunk.choices[0].delta.content;
        setMessages(messages => [...messages.slice(0, -1), {
          ...messages[messages.length-1],
          content: (messages[messages.length-1].content as string) + text
        }])
      }
      // Non-streaming
      // console.log(reply.choices[0].message);
      // setMessages(messages => [...messages, reply.choices[0].message])

      setCachedResponse(lastMessage.content as string, reply.choices[0].message.content as string);
    }
    if (messages[messages.length-1].role === "user") chat()
  }, [messages])

  const submit = (e: MouseEvent<HTMLButtonElement>) => {
    const { value: content } = e.target.previousSibling.children[1]
    setMessages((currMessages) => [...currMessages, { role: "user", content }])
  }
  
  return (
    <main className='wrapper space-y-2'>
      <LoadingOverlay loadingInfo={loadingInfo} text={text} />
      <div className='max-w-[75%] overflow-y-auto mx-auto space-y-2'>
        {messages.slice(1).map((message: webllm.ChatCompletionMessageParam) => (
          <div
            key={message.content as string}
            className={`p-2 border-2 border-gray-300 rounded-md ${message.role === "user" ? "bg-gray-100" : "bg-gray-200"}`}
          >
            <Markdown>
              {message.content as string}
            </Markdown>
          </div>
        ))}
      </div>
      <label htmlFor="prompt" className='flex flex-col items-center'>
        <p>Enter prompt here: </p>
        <textarea
          className='border-2 border-gray-300 rounded-md p-2 w-full'
        />
      </label>
      <button
        onClick={submit}
        className='border-2 border-gray-300 rounded-md p-2'
      >
        Chat
      </button>
    </main>
  )
}

export default App
