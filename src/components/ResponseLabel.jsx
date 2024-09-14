import React, {useEffect , useState} from "react";

function ResponseLabel({ termsAndConditionContent, linkText, termsLink , required }) {

    const [isChecked, setIsChecked] = useState(false);

    const clickableLink = (termsLink) => {
        if (termsLink) {
            return termsLink.startsWith("http://") || termsLink.startsWith("https://")
                ? termsLink
                : `http://${termsLink}`;
        }
    };

    function boldTextInStars(text) {
        return text.replace(/\*(.*?)\*/g, "<b>$1</b>");
    }


    useEffect(() => {
        window.JFCustomWidget.subscribe("submit", function() {
            if (termsAndConditionContent && typeof termsAndConditionContent === 'string' && termsAndConditionContent.trim().length !== 0){
                if (isChecked) {
                    window.JFCustomWidget.sendSubmit({
                        valid: true,
                        value: termsAndConditionContent
                    });
                } else {
                    window.JFCustomWidget.sendSubmit({
                        valid: false,
                        value: 'None'
                    });
                }
            } else {
                if (isChecked) {
                    console.log("else true")
                    window.JFCustomWidget.sendSubmit({
                        valid: true,
                        value: 'None'
                    });
                } else {
                    window.JFCustomWidget.sendSubmit({
                        valid: false,
                        value: 'None'
                    });
                }
            }
        });
    }, [isChecked]);


    const handleCheckboxChange = (event) => {
        setIsChecked(event.target.checked);
    };

    return (
        <>
            <div>
                <label className="flex items-start p-2 gap-2 text-base">
                    <input
                        type="checkbox"
                        name="checkbox"
                        id="checkbox"
                        onChange={handleCheckboxChange}
                        checked={isChecked}
                        className="mt-1 peer shrink-0 w-4 h-4 cursor-pointer rounded"
                    />
                    <div className="flex flex-col ">
                        <div className="min-h-10 max-h-48 pr-4 leading-6 overflow-auto text-base">
                            <div>
                                <ol>
                                    {termsAndConditionContent ? (
                                        <ul>
                                            {termsAndConditionContent
                                                .split(/\n(?=\d+\.\s)/)
                                                .map((item, index, arr) => {
                                                    const formattedItem = boldTextInStars(item.trim());
                                                    const match = formattedItem.match(/^(\d+\.\s)(.*)/s);
                                                    if (!match) {
                                                        return (
                                                            <li key={index} style={{listStyleType: "none"}}>
                                                                <span
                                                                    dangerouslySetInnerHTML={{__html: formattedItem}}/>
                                                                {index === arr.length - 1 && required && (
                                                                    <span className="text-red-600">*</span>
                                                                )}
                                                            </li>
                                                        );
                                                    }
                                                    const [_, number, rest] = match;
                                                    return (
                                                        <li key={index} style={{ listStyleType: "none" }}>
                                                            <strong>{number}</strong> <span dangerouslySetInnerHTML={{ __html: rest.trim() }} />
                                                            {index === arr.length - 1 && required && (
                                                                <span className="text-red-600">*</span>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                        </ul>
                                    ) : (
                                        <div className="text-base">
                                            By clicking the submit button, I agree to terms and conditions.{" "}
                                            {required ? (
                                            <span className="text-red-600">*</span>
                                            ):(<></>)}
                                        </div>
                                    )}
                                </ol>
                            </div>
                        </div>{" "}
                        <div>
                            <span>
                                <a
                                    className="text-blue-500 font-bold underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={clickableLink(termsLink)}
                                >
                                    {linkText}
                                </a>
                            </span>
                        </div>
                    </div>
                </label>
            </div>

        </>
    );
}

export default ResponseLabel;