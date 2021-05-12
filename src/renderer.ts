import DOMPurify from 'dompurify';
import marked from 'marked';
import './index.css';

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

let currentPresentation: Presentation | null = null;
let currentPosition = 0;

const root = document.documentElement;
const main = document.getElementById('main');
const promptSection = document.getElementById('prompt-sect');
const titleSection = document.getElementById('title-sect');
const titleEle = document.getElementById('title');
const subtitleEle = document.getElementById('subtitle');
const introSection = document.getElementById('intro-sect');
const questionSection = document.getElementById('question-sect');
const questionEle = document.getElementById('question');
const answerCols = questionSection.getElementsByClassName('answer-col');
const stronglyDisagreeEle = document.getElementById('strongly-disagree');
const disagreeEle = document.getElementById('disagree');
const neutralEle = document.getElementById('neutral');
const agreeEle = document.getElementById('agree');
const stronglyAgreeEle = document.getElementById('strongly-agree');

// Handle drag and drop files
main.ondragover = (event: DragEvent) => { event.preventDefault(); }
main.ondrop = (event: DragEvent) => {
  console.log('drop event')
  for (let i = 0; i < event.dataTransfer.files.length; i++) {
    event.dataTransfer.files.item(i).text().then((text: string) => {
      if (currentPresentation === null) {
        console.log('set presentation')
        currentPresentation = JSON.parse(text)
        if (currentPresentation.colorMain) root.style.setProperty('--main', currentPresentation.colorMain);
        if (currentPresentation.colorLight) root.style.setProperty('--light', currentPresentation.colorLight);
        currentPosition = 0;
        showTitleScreen();
      } else if (currentPosition > 0 + currentPresentation.introSlides.length) {
        console.log('set responses')
        const responses = text.split('\n').slice(6).map((line) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [index, name, email, datetime, question, answer] = line.split(',')
          return { name, answer }
        })
        currentPresentation.responses[currentPosition - 1 - currentPresentation.introSlides.length] = responses
        clearResponses()
        responses.forEach(pushResponse)
      }
      
    })
  }
}

// slide navigation by left and right arrow keys
document.onkeyup = (event) => {
  if (currentPresentation !== null && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
    switch (event.code) {
      case 'ArrowLeft':
        switch (currentPosition) {
          case 0:
            break;
          case 1:
            currentPosition = 0
            showTitleScreen()
            break;
          default:
            currentPosition--
            if (currentPosition <= currentPresentation.introSlides.length) {
              showIntroScreen(currentPosition - 1)
            } else {
              showQuestionScreen(currentPosition - 1 - currentPresentation.introSlides.length)
            }
            break;
        }
        break;
      case 'ArrowRight':
        switch (currentPosition) {
          case currentPresentation.questions.length + currentPresentation.introSlides.length:
            break;
          default:
            currentPosition++
            if (currentPosition <= currentPresentation.introSlides.length) {
              showIntroScreen(currentPosition - 1)
            } else {
              showQuestionScreen(currentPosition - 1 - currentPresentation.introSlides.length)
            }
            break;
        }
        break;
      default:
        break;
    }
  }
}

// title screen
const showTitleScreen = () => {
  promptSection.className = 'd-none';
  introSection.className = 'd-none';
  questionSection.className = 'd-none';

  if (currentPresentation === null) {
    console.error('No current presentation is open');
    return;
  }

  titleEle.textContent = currentPresentation.title;
  subtitleEle.textContent = currentPresentation.subtitle;

  titleSection.className = '';
}

// intro screen
const showIntroScreen = (index: number) => {
  promptSection.className = 'd-none';
  titleSection.className = 'd-none';
  questionSection.className = 'd-none';

  if (currentPresentation === null) {
    console.error('No current presentation is open');
    return;
  }
  if (index > currentPresentation.introSlides.length) {
    console.error('Index exceeds the number of intro slides in presentation');
    return;
  }

  introSection.innerHTML = DOMPurify.sanitize(
    marked(
      currentPresentation.introSlides[index]
    )
  )

  introSection.className = '';
}

// question screen
const showQuestionScreen = (index: number) => {
  promptSection.className = 'd-none';
  titleSection.className = 'd-none';
  introSection.className = 'd-none';
  
  if (currentPresentation === null) {
    console.error('No current presentation is open');
    return;
  }
  if (index > currentPresentation.questions.length) {
    console.error('Index exceeds the number of questions in presentation');
    return;
  }

  questionEle.textContent = currentPresentation.questions[index];
  clearResponses();
  currentPresentation?.responses?.[index]?.forEach(pushResponse)

  questionSection.className = '';
}

const clearResponses = () => {
  Array.prototype.forEach.call(answerCols, (col: Element) => {
    while (col.firstChild) { col.firstChild.remove(); }
  })
}

const pushResponse = (response: Response) => {
  const responseEle = document.createElement('div')
  responseEle.className = 'fs-3'
  responseEle.textContent = response.name
  switch (response.answer.split(';')[0].toLowerCase().trim()) {
    case 'strongly disagree':
      stronglyDisagreeEle.appendChild(responseEle)
      break;
    case 'disagree':
      disagreeEle.appendChild(responseEle)
      break;
    case 'neutral':
      neutralEle.appendChild(responseEle)
      break;
    case 'agree':
      agreeEle.appendChild(responseEle)
      break;
    case 'strongly agree':
      stronglyAgreeEle.appendChild(responseEle)
      break;
    default:
      console.error('Unexpected response answer value')
      break;
  }
}

