import React from 'react';

function TextInput({ sendPrompt }) {
    return (
        <div className='flex flex-col gap-2 mb-5'>
            <button type="button" onClick={sendPrompt} className="flex items-center justify-center gap-2 text-white color-white font-medium radius text-sm px-4 py-6 w-auto h-10 bg-blue-500 hover:bg-blue-600 hover:outline-none focus:border-blue-300">
                Generate terms & conditions
            </button>
        </div>
    );
}

export default TextInput;
