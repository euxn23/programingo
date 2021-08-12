import React, { useCallback, useRef, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import clsx from 'clsx'

type Question = {
  name: string
  keywords: KeywordData[]
  correctOrder: 'asc' | number[]
}

type KeywordData = {
  id: number // unique within Question
  text: string
}

type IndexedKeyword = KeywordData & {
  idx: number // index of user-edited keywords
}

type DraggedKeyword = IndexedKeyword & {
  from: 'keywords' | 'answers'
}

const question: Question = {
  name: 'JavaScript Arrow Function',
  keywords: [
    {
      id: 0,
      text: 'export',
    },
    {
      id: 1,
      text: 'default',
    },
    {
      id: 2,
      text: 'async',
    },
    {
      id: 3,
      text: 'function',
    },
    {
      id: 4,
      text: 'programingo',
    },
    {
      id: 5,
      text: '()',
    },
    {
      id: 6,
      text: '{',
    },
    {
      id: 7,
      text: 'return',
    },
    {
      id: 8,
      text: '"programingo"',
    },
    {
      id: 9,
      text: ';',
    },
    {
      id: 10,
      text: '}',
    },
  ],
  correctOrder: 'asc',
}

function useStore(): { question: Question } {
  return { question }
}

const draggableTypes = {
  choice: 'choice',
} as const

const Container: React.FC = ({ children }) => (
  <div className="flex justify-center bg-gray-600 h-screen">
    <div className="flex justify-center flex-col">{children}</div>
  </div>
)

const keywordClsx = (overwrite?: { text?: string; bg?: string }) =>
  clsx(
    'flex',
    'justify-center',
    'content-center',
    'cursor-pointer',
    'mx-2',
    'my-2',
    'px-4',
    'py-1',
    'min-w-8',
    'min-h-2',
    'rounded-3xl',
    overwrite?.text ?? 'text-gray-700',
    overwrite?.bg ?? 'bg-green-600'
  )

const dropDraggingInfoFromKeyword = (draggedKeyword: DraggedKeyword): IndexedKeyword => ({ id: draggedKeyword.id, text: draggedKeyword.text, idx: draggedKeyword.idx})

const Answers: React.FC<{ answers: Array<KeywordData | null> }> = ({
  answers,
}) => {
  const [, ref] = useDrop<DraggedKeyword, KeywordData[], any>({
    accept: draggableTypes.choice,
    hover(item, monitor) {
      if (item.from === 'answers') {
      }
    },
  })
  return (
    <div className="flex flex-wrap mx-8 justify-center" ref={ref}>
      {answers.map((answer, idx) =>
        answer ? <Answer key={idx} answer={answer} /> : <Empty key={idx} />
      )}
    </div>
  )
}

const Answer: React.FC<{ answer: KeywordData }> = ({ answer }) => {
  return <div className={clsx(keywordClsx())}>{answer.text}</div>
}

const Empty: React.FC = () => (
  <div className={clsx(keywordClsx({ bg: 'bg-gray-700' }))} />
)

const Keywords: React.FC<{
  keywords: IndexedKeyword[]
  setKeywords: React.Dispatch<React.SetStateAction<IndexedKeyword[]>>
}> = ({ keywords, setKeywords }) => {
  const [, ref] = useDrop<DraggedKeyword, KeywordData[], any>({
    accept: draggableTypes.choice,
    hover(item, monitor) {
      // if (item.from === 'answers') {
      //   console.log(
      //     keywords
      //       .filter((keyword) => keyword.idx !== item.idx)
      //       .reduce<IndexedKeyword[]>(
      //         (acc, keyword, idx) =>
      //           keyword.idx === idx
      //             ? [...acc, item, keyword]
      //             : [...acc, keyword],
      //         []
      //       )
      //   )
      // }
    },
  })
  return (
    <div className="flex flex-wrap mx-8 justify-center" ref={ref}>
      {keywords.map((keyword, idx) => (
        <Keyword
          keywords={keywords}
          keyword={{ ...keyword, idx }}
          setKeywords={setKeywords}
        />
      ))}
    </div>
  )
}

const Keyword: React.FC<{
  keywords: IndexedKeyword[]
  keyword: IndexedKeyword
  setKeywords: React.Dispatch<React.SetStateAction<IndexedKeyword[]>>
}> = ({ keywords, keyword, setKeywords }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [{ isDragging }, drag] = useDrag(() => ({
    type: draggableTypes.choice,
    item: { ...keyword, from: 'keywords' },
    isDragging: (monitor) => monitor.getItem().idx === keyword.idx,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))
  const [, drop] = useDrop<DraggedKeyword, KeywordData[], any>(
    {
      accept: draggableTypes.choice,
      hover(item, monitor) {
        console.log(item)
        console.log(monitor.getItem())
        console.log(keyword)
        // 自身の開始位置でドラッグしている状態なので何もしない
        if (item.idx === keyword.idx) {
          return
        }
        if (item.from === 'keywords') {
          // console.log(keyword)
          // console.log(item)
          const next = [...keywords]
          next[keyword.idx] = { ...item }
          next[item.idx] = { ...keyword }
          const theNext = next.map((n, idx) => ({ id: n.id, text: n.text, idx }))
          // console.log(theNext)
          item.idx = keyword.idx
          item.text = keyword.text
          item.id = keyword.id
          // console.log(item)
          setKeywords(theNext)
          // const next = keywords.reduce<IndexedKeyword[]>((acc, k, idx, arr) => {
          //   if (idx === keyword.idx) {
          //     return [...acc, { ...dropDraggingInfoFromKeyword(item), idx}]
          //   }
          //   if (idx === item.idx) {
          //     return [...acc, { ...keyword, idx }]
          //   }
          //   return [...acc, k]
          // }, [])
          // setKeywords(next)
        }
      },
    },
    [keyword, keywords, setKeywords]
  )

  drag(drop(ref))

  return (
    <div ref={ref} className={clsx(keywordClsx(), isDragging && 'opacity-40')}>
      ({keyword.idx}){keyword.id}:{keyword.text}
    </div>
  )
}

function Index() {
  const { question } = useStore()

  const [answers, setAnswers] = useState<Array<KeywordData | null>>(
    [...Array(question.keywords.length)].fill(null)
  )
  const [keywords, setKeywords] = useState<IndexedKeyword[]>(
    question.keywords.map((keyword, idx) => ({ ...keyword, idx }))
  )

  return (
    <Container>
      <DndProvider backend={HTML5Backend}>
        <Answers answers={answers} />
        <Keywords keywords={keywords} setKeywords={setKeywords} />
      </DndProvider>
    </Container>
  )
}

export default Index
