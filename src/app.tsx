import React, { RefObject, useCallback, useMemo, useRef, useState } from 'react'
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

type KeywordFrom = 'keywords' | 'answer'

type DraggedKeyword = IndexedKeyword & {
  from: KeywordFrom
  justSwapped: boolean
}

type KeywordGroups = 'keywords' | 'answer'

type KeywordsData = IndexedKeyword[]
type SetKeywords = React.Dispatch<React.SetStateAction<KeywordsData>>
type AnswerData = Array<IndexedKeyword | null>
type SetAnswer = React.Dispatch<React.SetStateAction<AnswerData>>


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


function fisherYatesShuffle<T> (arr: Array<T>) {
  return arr.reduce<T[]>((acc, cur, i) => {
    const j = Math.floor(Math.random() * (i + 1))
    return acc.map((e, idx) => {
      if (idx === i) {
        return acc[j]
      }
      if (idx === j) {
        return acc[i]
      }
      return e
    })
  }, [...arr])
}

function useStore(): { question: Question } {
  return { question }
}

const draggableTypes = {
  keyword: 'keyword',
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

type DraggablePermanentProps = {
  keywords: KeywordsData
  answer: AnswerData;
  setKeywords: SetKeywords
  setAnswer: SetAnswer
  side: KeywordGroups
  index: number
  keyword?: IndexedKeyword
}

const DroppablePermanent: React.FC<DraggablePermanentProps> = ({ keywords, answer, setKeywords, setAnswer, side, index, keyword }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [, drop] = useDrop<DraggedKeyword, KeywordData[], any>(
    {
      accept: draggableTypes.keyword,
      hover(item, monitor) {
        if (item.justSwapped) {
          item.justSwapped = false
        }
        // dnd の from:to のマトリクスパターンを Template Literal Type で表現
        const dndCase: `${KeywordGroups}:${KeywordGroups}` = `${item.from}:${side}`
        // 自身の開始位置でドラッグしている状態なので何もしない
        // FIXME
        if (((side === 'keywords' && item.idx === index) || keyword && item.id === keyword.id)) {
          return
        }
        switch(dndCase) {
          case 'keywords:keywords': {
            if (!keyword) {
              console.error('unexpected')
              return
            }
              const nextKeywords = keywords.reduce<IndexedKeyword[]>((acc, k, kIndex) => {
                if (kIndex === index) {
                  return [...acc, { ...dropDraggingInfoFromKeyword(item), idx: kIndex }]
                }
                if (kIndex === item.idx) {
                  return [...acc, { ...keyword, idx: kIndex }]
                }
                return [...acc, { ...k, idx: kIndex }]
              }, [])
              item.idx = index
              setKeywords(nextKeywords)

            break
          }
          case 'keywords:answer': {
            const nextKeywords = keywords.filter((k) => k.idx !== item.idx)
            let tmpIdx: number | undefined = undefined
            const nextAnswer = answer.map((a, aIndex) => {
              if (aIndex === index) {
                item.from = 'answer'
                item.idx = aIndex
                item.justSwapped = true
                return { ...item, idx: aIndex }
              }
              return a
            })

            setKeywords(nextKeywords)
            setAnswer(nextAnswer)

            break
          }

          case 'answer:answer': {
            let tmpIdx: number | undefined = undefined
            const nextAnswer = answer.map((a, aIndex) => {
              if (aIndex === item.idx) {
                return null
              }
              if (aIndex === index) {
                tmpIdx = aIndex
                item.justSwapped = true
                return { ...item, idx: aIndex}
              }
              return a
            })
            if (tmpIdx === undefined) {
              return
            }
            item.idx = tmpIdx

            setAnswer(nextAnswer)
          }
        }
      }
    }, [keywords, answer, setKeywords, setAnswer, side, keyword]
  )

  const [{ isDragging }, drag] = useDrag(() => ({
    type: draggableTypes.keyword,
    item: { ...keyword, from: side },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    isDragging: (monitor) => {
      if (!keyword) {
        return false
      }
      const item = monitor.getItem()
      return item.from === side && item.idx === keyword.idx
    }
  }), [keyword, side])

  if (keyword) {
    drag(drop(ref))

    return (
      <div ref={ref} className={clsx(keywordClsx(), isDragging && 'opacity-40')}>
        {keyword.text}
      </div>
    )
  } else {
    drop(ref)

    return (
      <div ref={ref} className={clsx(keywordClsx({ bg: 'bg-gray-700' }))} />
    )
  }
}

type KeywordContainerProps = {
  keywords: KeywordsData
  answer: AnswerData
  setKeywords: SetKeywords
  setAnswer: SetAnswer
}

const Answers: React.FC<KeywordContainerProps> = (props) => {
  return (
    <div className="flex flex-wrap mx-8 justify-center" >
      {props.answer.map((keyword, index) =>
        <DroppablePermanent key={index} {...props} keyword={keyword ?? undefined} index={index} side="answer" />
      )}
    </div>
  )
}

const Keywords: React.FC<KeywordContainerProps> = (props) => {
  return (
    <div className="flex flex-wrap mx-8 justify-center" >
      {props.keywords.map((keyword, index) => (
        <DroppablePermanent
          key={index}
          {...props}
          keyword={keyword}
          index={index}
          side="keywords"
        />
      ))}
    </div>
  )
}

export const App: React.FC = () => {
  const { question } = useStore()

  const [answer, setAnswer] = useState<AnswerData>(
    [...Array(question.keywords.length)].fill(null)
  )
  const [keywords, setKeywords] = useState<KeywordsData>(
    fisherYatesShuffle(question.keywords).map((keyword, idx) => ({ ...keyword, idx }))
  )

  return (
    <Container>
      <DndProvider backend={HTML5Backend}>
        <Answers keywords={keywords} answer={answer} setKeywords={setKeywords} setAnswer={setAnswer} />
        <Keywords keywords={keywords} answer={answer} setKeywords={setKeywords} setAnswer={setAnswer} />
      </DndProvider>
    </Container>
  )
}

