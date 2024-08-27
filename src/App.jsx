import {  useEffect, useState } from 'react'
import './index.css'
import TextInput from "./components/TextInput.jsx";
import ResponseLabel from "./components/ResponseLabel.jsx";

function App() {
    const [termsAndConditionContent, setTermsAndConditionContent] = useState('');
    const [inputPrompt, setInputPrompt] = useState('');


    const handleInputChange = (e) => {
        setInputPrompt(e.target.value);
    };
    const handleTermsAndConditionChange = (e) => {
        setTermsAndConditionContent(e.target.value);
    };

    const sendPrompt = async () => {
        try {
            const formData = new FormData();
            formData.append('prompt', inputPrompt);

            const response = await fetch('https://rc-akdemir.jotform.dev/intern-api/API/widgets/terms_and_conditions/ask_ai', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setTermsAndConditionContent(data.content);

        } catch (error) {
            console.error('API request failed:', error);
        }
    };


    useEffect(() => {

    window.JFCustomWidget.subscribe("ready", () => {
        const queryStringData = JFCustomWidget.getAllQueryString();
        const initialTermsAndConditionContent  = queryStringData['termsContent'];
        setTermsAndConditionContent(initialTermsAndConditionContent);

        const initialInputPrompt  = queryStringData['AIPrompt'];
        setInputPrompt(initialInputPrompt);

        // console.log(JFCustomWidget.getWidgetData());
        // console.log(queryStringData);
    });

    window.JFCustomWidget.subscribe("submit", function() {
        window.JFCustomWidget.sendSubmit({
            valid: true,
            value: termsAndConditionContent
        });
    });
        // console.log(termsAndConditionContent);
        // console.log(JFCustomWidget.getAllQueryString())
    },[termsAndConditionContent]);


  return (
    <>
        <div>
            <TextInput inputValue={inputPrompt} handleInputChange={handleInputChange} sendPrompt={sendPrompt} />
            <ResponseLabel termsAndConditionContent={termsAndConditionContent} handleTermsAndConditionChange={handleTermsAndConditionChange}/>
        </div>
    </>
  )
}

export default App
