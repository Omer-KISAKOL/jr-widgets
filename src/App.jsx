import {  useEffect, useState } from 'react'
import './index.css'
import ResponseLabel from "./components/ResponseLabel.jsx";

function App() {
    const [termsAndConditionContent, setTermsAndConditionContent] = useState('');
    const [linkText, setLinkText] = useState('');
    const [termsLink, setTermsLink] = useState('')
    const [required, setRequired] = useState()

    const handleTermsAndConditionChange = (e) => {
        setTermsAndConditionContent(e.target.value);
    };

    useEffect(() => {

        // console.log(JFCustomWidget.getAllQueryString())
        // console.log(JFCustomWidget.getWidgetData());

        window.JFCustomWidget.subscribe("ready", () => {
            const queryStringData = JFCustomWidget.getAllQueryString();
            const initialTermsAndConditionContent  = queryStringData['termsContent'];
            setTermsAndConditionContent(initialTermsAndConditionContent);
            setLinkText(queryStringData['linkText']);
            setTermsLink(queryStringData['termsLink']);
            setRequired(JFCustomWidget.getWidgetData()['required'])

        });

    },[termsAndConditionContent]);

  return (
    <>
        <div>
            <ResponseLabel
                termsAndConditionContent={termsAndConditionContent}
                handleTermsAndConditionChange={handleTermsAndConditionChange}
                linkText={linkText}
                termsLink={termsLink}
                required={required}
            />
        </div>
    </>
  )
}

export default App
