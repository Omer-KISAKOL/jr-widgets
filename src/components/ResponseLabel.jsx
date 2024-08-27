import React from 'react';

function ResponseLabel({ termsAndConditionContent }) {
    return (
        <div>
            <label className="flex gap-1 text-xl">
                <input type="checkbox" name="checkbox" id="checkbox"/>
                <div className='font-medium'>
                  <span>
                       {termsAndConditionContent}
                  </span>
                </div>
            </label>
        </div>
    );
}

export default ResponseLabel;
