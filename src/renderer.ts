import DOMPurify from 'dompurify';
import marked from 'marked';
import { parseString } from '@fast-csv/parse';
import './index.css';
// @ts-ignore
import titleImg from './img/title-img.jpg';
// @ts-ignore
import questionIconImg from './img/message-icon.jpg';
// @ts-ignore
import questionXImg from './img/blackx.svg';


interface Response {
  name: string;
  answer: string;
}

interface Presentation {
  title: string;
  subtitle: string;
  introSlides: string[];
  questions: string[];
  responses: Response[][];
  colorMain?: string;
  colorLight?: string;
}

document.getElementById('title-img-div').style.background = `15% center / cover no-repeat url('${titleImg}')`
document.getElementById('question-big-icon').style.background = `center / contain no-repeat url('${questionIconImg}')`
document.getElementById('question-x').style.background = `center / contain no-repeat url('${questionXImg}')`

let currentPresentation: Presentation | null = null
let currentPosition = 0
let questionBigVisible = false
let blankScreenVisible = false

const root = document.documentElement
const main = document.getElementById('main')
const blankScreen = document.getElementById('blank-screen')
const promptSection = document.getElementById('prompt-sect')
const titleSection = document.getElementById('title-sect')
const titleEle = document.getElementById('title')
const subtitleEle = document.getElementById('subtitle')
const introSection = document.getElementById('intro-sect')
const questionSection = document.getElementById('question-sect')
const questionEle = document.getElementById('question')
const questionBigDiv = document.getElementById('question-big-div')
const questionBig = document.getElementById('question-big')
const answerCols = questionSection.getElementsByClassName('answer-col')
const stronglyDisagreeEle = document.getElementById('strongly-disagree')
const disagreeEle = document.getElementById('disagree')
const neutralEle = document.getElementById('neutral')
const agreeEle = document.getElementById('agree')
const stronglyAgreeEle = document.getElementById('strongly-agree')

// Handle drag and drop files
main.ondragover = (event: DragEvent) => { event.preventDefault() }
main.ondrop = (event: DragEvent) => {
  console.log('drop event')
  for (let i = 0; i < event.dataTransfer.files.length; i++) {
    event.dataTransfer.files.item(i).text().then((text: string) => {
      if (currentPresentation === null) {
        console.log('set presentation')
        currentPresentation = JSON.parse(text)
        if (currentPresentation.colorMain) root.style.setProperty('--main', currentPresentation.colorMain)
        if (currentPresentation.colorLight) root.style.setProperty('--light', currentPresentation.colorLight)
        currentPosition = 0;
        showTitleScreen();
      } else if (currentPosition > 0 + currentPresentation.introSlides.length) {
        console.log('set responses')
        const responses: Response[] = []
        parseString(text, {
          headers:[
            'index', 'name', 'email', 'datetime', 'question', 'answer'
          ],
          discardUnmappedColumns: true,
          skipLines: 6,
        }).on('error', error => console.log(error))
          .on('data', ({ name, answer }) => responses.push({ name, answer }))
          .on('end', () => {
            currentPresentation.responses[currentPosition - 1 - currentPresentation.introSlides.length] = responses
            clearResponses()
            responses.forEach(pushResponse)
          })
      }
    })
  }
}

// slide navigation by left and right arrow keys
// space -> toggle blank screen
document.onkeyup = (event) => {
  if (currentPresentation !== null && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
    switch (event.code) {
      case 'ArrowLeft':
        switch (currentPosition) {
          case 0:
            break
          case 1:
            currentPosition = 0
            showTitleScreen()
            break
          default:
            if (currentPosition <= currentPresentation.introSlides.length + 1) {
              if (questionBigVisible) {
                currentPosition--
                hideQuestionBig()
                showIntroScreen(currentPosition - 1)
              } else {
                showQuestionBig()
              }
            } else if (questionBigVisible) {
              currentPosition--
              hideQuestionBig()
              showQuestionScreen(currentPosition - 1 - currentPresentation.introSlides.length)
            } else {
              showQuestionBig()
            }
            break
        }
        break;
      case 'ArrowRight':
        switch (currentPosition) {
          case currentPresentation.questions.length + currentPresentation.introSlides.length:
            if (questionBigVisible) hideQuestionBig()
            break
          default:
            if (currentPosition < currentPresentation.introSlides.length) {
              currentPosition++
              showIntroScreen(currentPosition - 1)
            } else if (!questionBigVisible) {
              currentPosition++
              showQuestionScreen(currentPosition - 1 - currentPresentation.introSlides.length)
              showQuestionBig()
            } else {
              hideQuestionBig()
            }
            break
        }
        break
      case 'Space':
        blankScreenVisible = !blankScreenVisible
        blankScreen.className = blankScreenVisible ? '' : 'd-none'
        break
      default:
        break
    }
  }
}

// title screen
const showTitleScreen = () => {
  promptSection.className = 'd-none'
  introSection.className = 'd-none'
  questionSection.className = 'd-none'

  if (currentPresentation === null) {
    console.error('No current presentation is open')
    return;
  }

  titleEle.textContent = currentPresentation.title
  subtitleEle.textContent = currentPresentation.subtitle

  titleSection.className = ''
}

// intro screen
const showIntroScreen = (index: number) => {
  promptSection.className = 'd-none'
  titleSection.className = 'd-none'
  questionSection.className = 'd-none'

  if (currentPresentation === null) {
    console.error('No current presentation is open')
    return
  }
  if (index > currentPresentation.introSlides.length) {
    console.error('Index exceeds the number of intro slides in presentation')
    return
  }

  introSection.innerHTML = DOMPurify.sanitize(
    marked(
      currentPresentation.introSlides[index]
    )
  )

  introSection.className = ''
}

// question screen
const showQuestionScreen = (index: number) => {
  promptSection.className = 'd-none'
  titleSection.className = 'd-none'
  introSection.className = 'd-none'
  
  if (currentPresentation === null) {
    console.error('No current presentation is open')
    return
  }
  if (index > currentPresentation.questions.length) {
    console.error('Index exceeds the number of questions in presentation')
    return
  }

  questionEle.textContent = currentPresentation.questions[index]
  questionBig.textContent = currentPresentation.questions[index]
  clearResponses()
  currentPresentation?.responses?.[index]?.forEach(pushResponse)

  questionSection.className = ''
}

const clearResponses = () => {
  Array.prototype.forEach.call(answerCols, (col: Element) => {
    while (col.firstChild) { col.firstChild.remove() }
  })
}

const pushResponse = (response: Response) => {
  const responseEle = document.createElement('div')
  responseEle.className = 'fs-2'
  responseEle.textContent = response.name
  switch (response.answer.toLowerCase().trim()) {
    case 'strongly disagree':
      stronglyDisagreeEle.appendChild(responseEle)
      break
    case 'disagree':
      disagreeEle.appendChild(responseEle)
      break
    case 'neutral':
      neutralEle.appendChild(responseEle)
      break
    case 'agree':
      agreeEle.appendChild(responseEle)
      break
    case 'strongly agree':
      stronglyAgreeEle.appendChild(responseEle)
      break
    default:
      console.error('Unexpected response answer value')
      break
  }
}

const showQuestionBig = () => {
  questionBigVisible = true
  questionSection.className = 'blur'
  questionBigDiv.className = 'onscreen'
}

const hideQuestionBig = () => {
  questionBigVisible = false
  questionSection.className = ''
  questionBigDiv.className = 'offscreen'
}

