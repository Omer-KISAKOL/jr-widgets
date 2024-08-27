import PropTypes from 'prop-types';
import React from 'react';
import orderBy from 'lodash/orderBy';
import flatten from 'lodash/flatten';
import isUndefined from 'lodash/isUndefined';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';
import unescape from 'lodash/unescape';
import { Button } from '@jotforminc/magnet';
import { IconCheckCircleFilled, IconExclamationCircleFilled } from '@jotforminc/svg-icons';

import { ImageUploadWithViewer } from '@jotforminc/image-upload';
import { translate } from '../../mixins/Translation';
import TextInput from '../../components/TextInput';
import Textarea from '../../components/Textarea';
import Dropdown from '../../components/Dropdown';
import Checkbox from '../../components/Checkbox';
import Radio from '../../components/Radio';
import RadioGroup from '../../components/RadioGroup';
import ColorPicker from '../../components/ColorPicker';
// import ImagePicker from '../../components/ImageUpload';
import MultiImage from '../../components/MultiImage';
import Schema from '../../components/Schema';
import Toggle from '../../components/Toggle';
import DatePicker from '../../components/DatePicker';
import ExternalField from './fields/ExternalField';
import CheckListField from './fields/CheckListField';
import FileUploadField from './fields/FileUploadField';
import RemoteOptions from './fields/RemoteOptions';
import {
    Tab,
    Tabs
} from '../../components/Tabs';

// const imageUploadFields = ['529cd0ea8afa8f742d000004.images'];
const FieldTypeToComponent = {
    color: ColorPicker,
    text: TextInput,
    textarea: Textarea,
    select: Dropdown,
    checkbox: Checkbox,
    radio: Radio,
    radiogroup: RadioGroup,
    widget: ExternalField,
    checklist: CheckListField,
    fileupload: FileUploadField,
    multipleimage: MultiImage,
    date: DatePicker,
    remoteoptions: RemoteOptions,
    toggle: Toggle
};
// for NDT Date Picker widget
const datePickerWidgetMap = {
    'm/d/y': 'MM/DD/YYYY',
    'd/m/y': 'DD/MM/YYYY',
    'y-m-d': 'YYYY-MM-DD',
    'd.m.y': 'DD.MM.YYYY'
};

const translatedOptions = (options, type) => {
    if (typeof options === 'string') {
        if (options.split(',').length > 1 && type === 'checklist') { // if splittable
            return options.split(',').map(name => {
                return { translatedName: translate(name.trim()), name: name.trim() };
            });
        }
        return options;
    }
    return (options || []).map(option => ({ ...option, text: translate(option.text) }));
};

const DefaultType = 'text';
const SQL_DROPDOWN_WIDGET_ID = 'd871f89eb5f97f510c2d4e4b';
const AI_TermsandCondition_ID = '869d4f9c07993e2528ef3ece';

class ConfigurationForm extends React.Component {
    constructor(props) {
        super(props);
        const schema = flatten(this.props.schema);
        this.state = {
            values: schema.reduce((values, control) => {
                // set real value even if its empty
                let value = control.attributes.defaultValue || '';
                if (
                    ('value' in control.attributes)
                    && (
                        value !== control.attributes.value
                        || Number(control.attributes.value).toString() === control.attributes.value
                    )
                ) {
                    value = control.attributes.value;
                } else {
                    value = translate(value);
                }
                if (isObject(value)) {
                    value = JSON.stringify(value, null, 2);
                }
                values.push({
                    name: control.attributes.name,
                    value
                });
                return values;
            }, []),
            hiddenHintTexts: [],
            buttonStates: {
                testConnectionButton: {
                    testing: false,
                    testResult: null,
                    timeout: false
                },
                testQueryButton: {
                    testing: false,
                    testResult: null,
                    timeout: false
                }
            }
        };

        this.handleFormSubmit = this.handleFormSubmit.bind(this);
    }


    render() {
        const { schema, conditions } = this.props;
        // form question is the question we received from builder
        // i passed it to quickly make customCSS tab working

        const elements = this.applyConditions({ conditions, controls: schema[0] });
        const dataSourcesHeading = React.createElement('h3', {
            className: 'sd-headingFirst'
        }, translate('Data Source Authentication Settings'));
        const questions = elements.map((element, i) => {
            // do not render custom css field on general tab
            if (element.attributes.name.toLowerCase() === 'customcss') {
                return '';
            }

            const question = this.createQuestionElement(element);
            if ((i === 0 && element.parameters.parentID === SQL_DROPDOWN_WIDGET_ID)) {
                return (
                    <div key={['prop_wrapper', element.attributes.name].join('_')}>
                        {question && (
                            <div style={{ padding: '20px' }} className="v4-line v4-widgets-line">
                                {dataSourcesHeading}
                                {question}
                            </div>
                        )}
                    </div>
                );
            }

            return (
                question && (
                    <div
                        key={['prop_wrapper', element.attributes.name].join('_')}
                        style={i === 0 ? { padding: '20px' } : { padding: '20px', borderTop: '1px solid #ece9e6' }}
                        className="v4-line v4-widgets-line"
                    >
                        {question}
                    </div>
                )
            );
        });

        let formContent = questions;

        if (schema.length > 1) { // schema is an array of array of controls, it is length is two if customCSS tab is given
            const customCSSElement = schema[1][0];
            const customCSSControl = this.createQuestionElement(customCSSElement);
            formContent = (
                <Tabs kind="inner" activeKey={1} onChange={key => { key; }}>
                    <Tab eventKey={1} title={translate('General')}>
                        {questions}
                    </Tab>
                    {!this.props.isCardBuilder
                        && (
                            <Tab eventKey={2} title={translate('Custom CSS')}>
                                <div className="v4-widgets-line-css">
                                    <div key={`prop_wrapper_${customCSSElement.name}`} style={{ padding: 20 }}>
                                        {customCSSControl}
                                        <p>{translate('Customize this widget\'s look & feel by adding CSS code below.')}</p>
                                    </div>
                                </div>
                            </Tab>
                        )}
                </Tabs>
            );

        }
        return (
            <form onSubmit={this.handleFormSubmit}>
                {formContent}
            </form>
        );
    }

    handleFormSubmit(e) {
        e.preventDefault();
    }

    setHintTextVisibility(name, show = true) {
        let hiddenHintTexts = [...this.state.hiddenHintTexts];
        if (!show) {
            hiddenHintTexts.indexOf(name) === -1 && hiddenHintTexts.push(name);
        } else {
            delete (hiddenHintTexts[hiddenHintTexts.indexOf(name)]);
            hiddenHintTexts = hiddenHintTexts.filter(Boolean);
        }
        this.setState({
            hiddenHintTexts
        });
    }

    handleChange(e) {
        const values = this.state.values.slice(0);
        const el = ('currentTarget' in e) ? e.currentTarget : e;
        const { name } = el;
        let newValue = el.value;
        if (el.type === 'checkbox') {
            if (el.checked) {
                el.value = 'true';
            } else {
                el.value = 'false';
            }
            newValue = el.value;
            const objType = Object.prototype.toString.call(el.form.elements[name]);
            if (objType === '[object RadioNodeList]' || objType === '[object NodeList]' || objType === '[object HTMLCollection]') {
                const checkedBoxes = (Array.isArray(values[name]) ? values[name].slice() : []);
                if (el.checked) {
                    checkedBoxes.push(el.value);
                } else {
                    checkedBoxes.splice(checkedBoxes.indexOf(el.value), 1);
                }
                newValue = checkedBoxes;
            }
        }

        const val = values.map(value => {
            if (value.name === el.name) {
                value.value = newValue;

                // include type for escaping purposes when saving the config
                value.type = el.type;
            }
            return value;
        });

        this.setState({
            values: val
        }, () => {
            if (this.props.onValuesChange) {
                this.props.onValuesChange(val);
            }
        });
    }


    applyConditions({ conditions, controls } = { conditions: [], controls: [] }) {
        const cConditions = orderBy(conditions.slice(0), 'priority', 'desc');
        const cControls = controls.slice(0);

        return cControls.reduce((controlList, control) => {
            const relatedConditions = cConditions.filter(condition => {
                const actionTargets = condition.actions.map(action => action.target);
                return actionTargets.indexOf(control.attributes.name) >= 0;
            });

            if (relatedConditions.length <= 0) {
                controlList.push(control);
                return controlList;
            }

            relatedConditions.forEach(condition => {
                const conditionTarget = cControls.find(c => c.attributes.name === condition.target);
                const termsPassed = condition.terms.some(orTerm => {
                    return orTerm.every(andTerm => {
                        const currentValue = this.state.values.find(value => value.name === conditionTarget.attributes.name);
                        return andTerm.value === currentValue.value;
                    });
                });
                if (termsPassed) {
                    // TODO: apply action type
                    // for now it is just show/hide
                    controlList.push(control);
                }
            });

            return controlList;
        }, []);
    }

    createQuestionElement(element) {
        // for apiauth parameter
        if (element.attributes.type === 'hidden') {
            return false;
        }
        let type = element.nodeName;
        if (type === 'input') {
            type = element.attributes.type;
        }
        let field = FieldTypeToComponent[type];

        if (typeof field === 'undefined') {
            field = FieldTypeToComponent[DefaultType];
        }


        let formControls = [];

        const currentValue = this.state.values.find(value => value.name === element.attributes.name);

        /* compound form controls; there are multiple dom elements */

        if (element.parameters && element.parameters.type === 'schema') {
            const schema = (
                <Schema
                    value={currentValue.value} definition={element.parameters.definition} onChange={value => {
                    this.handleChange({
                        name: element.attributes.name,
                        value: value,
                        type
                    });
                }}
                />
            );
            formControls.push(schema);
        } else if (element.parameters && element.parameters.type === 'multipleimage') {
            const imageUpload = (
                <ImageUploadWithViewer
                    imageUploadProps={{ forceSelect: false }}
                    isSortable={element.parameters.sortable === 'enabled'}
                    defaultValue={currentValue.value && currentValue.value.trim() ? currentValue.value.split('\n') : []}
                    onChange={res => this.handleChange({
                        name: element.attributes.name,
                        value: res.join('\n'),
                        type
                    })}
                />
            );
            formControls.push(imageUpload);
        } else if (element.parameters && element.parameters.type === 'keyvaluepair') {
            const acceptedQuestions = [
                'control_fullname',
                'control_image',
                'control_number',
                'control_email',
                'control_address',
                'control_spinner',
                'control_scale',
                'control_phone',
                'control_rating',
                'control_matrix',
                'control_textbox',
                'control_fileupload',
                'control_time',
                'control_textarea',
                'control_dropdown',
                'control_radio',
                'control_checkbox',
                'control_datetime',
                'control_slider',
                'control_emojislider'
            ];

            let options = [{
                id: 1,
                value: '',
                text: ''
            }];

            if (element.attributes.defaultValue === 'formfields') {
                options = options.concat(this.props.questions.filter(question => {
                    return acceptedQuestions.includes(question.type);
                }).map((question, i) => {
                    return {
                        id: [element.attributes.id, question.qid, i].join('.'),
                        value: question.qid,
                        text: question.text || '-'
                    };
                }));
            } else if (element.attributes.defaultValue === 'static') {
                const { sourceValue = '' } = element.parameters;
                options = sourceValue.split(/\r\n|\r|\n/g).map((option, i) => {
                    let value = option;
                    let text = option || '-';
                    if (option.includes('::')) {
                        [value, text] = option.split('::');
                    }

                    return {
                        id: [element.attributes.id, i].join('.'),
                        value,
                        text
                    };
                });
            }

            formControls.push(React.createElement(FieldTypeToComponent.select, {
                ...element.attributes,
                key: ['widgetProp', element.attributes.name].join('-'),
                value: currentValue.value,
                options,
                onChange: this.handleChange.bind(this)
            }));
        } else if (['radio', 'checkbox'].indexOf(type) >= 0) {
            if (['radio'].indexOf(type) >= 0) {
                element.options.forEach(option => {
                    formControls.push(React.createElement(field, {
                        ...element.attributes,
                        key: ['widgetProp', element.attributes.name, option.value].join('-'),
                        onChange: this.handleChange.bind(this),
                        id: option.id || null,
                        value: option.value,
                        label: translate(option.text),
                        checked: currentValue.value === option.value
                    }));
                });
            } else { // if it is a checkbox
                // make the value to "true" if the default value is "on" or "1"
                // the "1" is a response from the API(comes from v4 editor request)
                if (currentValue.value === 'on' || currentValue.value === '1' || currentValue.value === true) {
                    currentValue.value = 'true';
                }

                element.options.forEach(option => {
                    formControls.push(React.createElement('label', {
                        key: ['widgetProp', option.value, 'label'].join('-'),
                        className: 'checkBox'
                    }, [
                        React.createElement(field, {
                            ...element.attributes,
                            key: ['widgetProp', element.attributes.name, option.value].join('-'),
                            onChange: this.handleChange.bind(this),
                            id: option.id || null,
                            value: option.value,
                            checked: currentValue.value === option.value
                        }),
                        /* if there is only one option don't put label */
                        React.createElement('span', {
                            className: 'checkBox-label',
                            key: ['widgetProp', element.attributes.name, option.value, 'label'].join('-')
                        }, translate(element.label))
                    ]));
                });
            }
        } else if (type === 'color') {
            formControls.push(React.createElement(field, {
                ...element.attributes,
                key: ['widgetProp', element.attributes.name].join('-'),
                value: currentValue.value,
                onChange: e => {
                    const elValue = ('currentTarget' in e) ? e.currentTarget.value : e.value;
                    const value = (isString(e)) ? e : elValue;
                    this.handleChange({
                        name: element.attributes.name,
                        value,
                        type
                    });
                }
            }));
        } else if (type === 'fileupload') {
            formControls.push(React.createElement(field, {
                ...element.attributes,
                parameters: { ...element.parameters },
                key: ['widgetProp', element.attributes.name].join('-'),
                value: currentValue.value,
                username: this.props.user.username,
                onFileUpload: file => {
                    this.handleChange({
                        name: element.attributes.name,
                        value: file,
                        type
                    });
                }
            }));
        } else if (type === 'date') {
            formControls.push(React.createElement(field, {
                ...element.attributes,
                value: currentValue.value,
                onChange: ({ value }) => this.handleChange({
                    value: value ? value.format('YYYY-MM-DD') : '',
                    name: element.attributes.name,
                    type
                })
            }));
        } else if (type === 'toggle') {
            const toggleElement = React.createElement(field, {
                ...element.attributes,
                type: 'narrow',
                labelNameTrue: translate(element.parameters.toggleOnText || 'Yes'),
                labelNameFalse: translate(element.parameters.toggleOffText || 'No'),
                valueChecked: 'Yes',
                valueUnchecked: 'No',
                initialValue: currentValue.value,
                onChange: e => this.handleChange({
                    value: e,
                    name: element.attributes.name,
                    type
                })
            });
            formControls.push(toggleElement);
        } else if (type === 'radiogroup') {
            const radioGroupElement = React.createElement(field, {
                name: element.attributes.name,
                defaultValue: currentValue.value,
                options: element.options,
                onChange: e => this.handleChange({
                    value: e.target.value,
                    name: element.attributes.name,
                    type
                })
            });
            formControls.push(radioGroupElement);
        } else {
            // add extra props from external widget fields
            let extraProps = {};
            if (type === 'widget') {
                extraProps = {
                    formID: this.props.formID
                };
            }

            if (type === 'remoteoptions') {
                extraProps = {
                    emptyOptionsMessage: element.parameters.emptyOptionsMessage,
                    apiEndpoint: element.parameters.apiEndpoint,
                    formID: this.props.formID,
                    setHintTextVisibility: this.setHintTextVisibility.bind(this)
                };
            }

            // unescape value for text/ textarea for now
            // we can add other fields in the future
            if (['textarea', 'text'].includes(type)) {
                currentValue.value = unescape(currentValue.value);
            }

            /* single form control */
            formControls.push(React.createElement(field, {
                ...element.attributes,
                key: ['widgetProp', element.attributes.name].join('-'),
                options: translatedOptions(element.options, type),
                onChange: this.handleChange.bind(this),
                value: currentValue.value,
                placeholder: element.attributes.placeholder,
                ...extraProps
            }));
        }

        // NDT
        const querySettingsHeading = React.createElement('h3', {
            className: 'sd-heading'
        }, translate('Query Settings'));
        const serverDetailsHeading = React.createElement('h3', {
            className: 'sd-serverDetails'
        }, translate('Server Details'));

        if (element && element.attributes && element.attributes.name === 'cameraFacing' && this.props.isNewDefaultTheme) {
            formControls = [];

            element.options.forEach(option => {
                formControls.push(React.createElement('label', {
                    className: 'eachRadio cameraFacingOptions'
                }, [
                    React.createElement('input', {
                        type: 'radio',
                        name: element.parameters.name,
                        value: option.value,
                        checked: currentValue.value === option.value || currentValue.value === translate(option.value),
                        onChange: this.handleChange.bind(this),
                        style: { display: 'none' }
                    }),
                    React.createElement('span', {
                        className: 'eachRadio-label'
                    }, translate(option.text))
                ]));
            });
        }

        const getValue = name => {
            return this.state.values.find(item => item.name === name)?.value;
        };

        const createTestButton = (name, defaultText, action) => {
            const defaultState = {
                colorStyle: 'secondary',
                size: 'small'
            };

            const loadingState = {
                ...defaultState,
                loader: true,
                loaderText: 'Loading'
            };

            const successState = {
                ...defaultState,
                colorStyle: 'success',
                startIcon: IconCheckCircleFilled
            };

            const errorState = {
                ...defaultState,
                colorStyle: 'error',
                startIcon: IconExclamationCircleFilled
            };

            let buttonProps = defaultState;
            let buttonText = defaultText;

            const formData = new URLSearchParams();
            formData.append('formID', this.props.formID);
            formData.append('qid', this.props.questions.find(q => q.selectedField === SQL_DROPDOWN_WIDGET_ID)?.qid);
            formData.append('host', getValue('host'));
            formData.append('port', getValue('port'));
            formData.append('username', getValue('username'));
            formData.append('password', getValue('password'));
            formData.append('databaseName', getValue('databaseName'));
            formData.append('authType', getValue('authType'));
            formData.append('sqlStatement', getValue('sqlStatement'));


            const testConnection = async () => {
                formData.delete('action');
                formData.append('action', action);
                return fetch('/API/widgets/testSQLDropdown', {
                    method: 'POST',
                    body: formData
                });
            };

            if (this.state.buttonStates[name]?.testing) {
                buttonProps = loadingState;
                buttonText = 'Loading';
            }

            const clearState = () => {
                const tid = setTimeout(() => {
                    buttonProps = defaultState;
                    buttonText = defaultText;
                    this.setState({
                        buttonStates: {
                            ...this.state.buttonStates,
                            [name]: {
                                testResult: null,
                                testing: false,
                                timeout: false
                            }
                        }
                    });
                }, 5000);

                this.setState({
                    buttonStates: {
                        ...this.state.buttonStates,
                        [name]: {
                            ...this.state.buttonStates[name],
                            timeout: tid
                        }
                    }
                });
            };

            if (this.state.buttonStates[name]?.testResult === 'success') {
                buttonProps = successState;
                buttonText = 'Succeeded';
                if (!this.state.buttonStates[name]?.timeout) {
                    clearState();
                }
            }

            if (this.state.buttonStates[name]?.testResult === 'error') {
                buttonProps = errorState;
                buttonText = 'Error';
                if (!this.state.buttonStates[name]?.timeout) {
                    clearState();
                }
            }

            const onClick = () => {
                if (this.state.buttonStates[name]?.testing || ['success', 'error'].includes(this.state.buttonStates[name]?.testResult)) return;
                // Change State
                this.setState({
                    buttonStates: {
                        ...this.state.buttonStates,
                        [name]: {
                            ...this.state.buttonStates[name],
                            testing: true
                        }
                    }
                });

                testConnection().then(r => r.json()).then(response => {
                    this.setState({
                        buttonStates: {
                            ...this.state.buttonStates,
                            [name]: {
                                ...this.state.buttonStates[name],
                                testResult: response.content,
                                testing: false
                            }
                        }
                    });
                }).catch(() => {
                    this.setState({
                        buttonStates: {
                            ...this.state.buttonStates,
                            [name]: {
                                ...this.state.buttonStates[name],
                                testResult: 'error',
                                testing: false
                            }
                        }
                    });
                });
            };

            const TestConnectionButton = (
                <>
                    <Button
                        className="mt-6"
                        {...buttonProps}
                        onClick={onClick}
                    >
                        {buttonText}
                    </Button>
                </>
            );

            return TestConnectionButton;
        };
        const hr = React.createElement('hr', {
            className: 'sqlHr'
        });
        if (element.attributes.id === `${SQL_DROPDOWN_WIDGET_ID}.databaseName`) {
            formControls.push(createTestButton('testConnectionButton', 'Test Connection', 'checkConnection'));
            formControls.push(hr);
            formControls.push(querySettingsHeading);
        }
        if (element.attributes.id === `${SQL_DROPDOWN_WIDGET_ID}.authenticationType`) {
            formControls.push(serverDetailsHeading);
        }

        if (element.attributes.id === `${SQL_DROPDOWN_WIDGET_ID}.sqlStatement`) {
            formControls.push(<div style={{ color: '#a0a6b6' }}>
                Your database is directly affected by SQL commands. Please make sure the given user credentials have
                {' '}
                <b style={{ color: '#EDF8FF' }}>limited</b>
                {' '}
                access.
            </div>);
            formControls.push(createTestButton('testQueryButton', 'Validate Query', 'checkQuery'));
        }



        // for only NDT Date Picker widget (TO-DO)
        if (element && element.attributes && (element.attributes.id === '52934dbf3be147110a000030.dateFormat' || element.attributes.id === '52934dbf3be147110a000030.todayDate') && this.props.isNewDefaultTheme) {
            formControls = [];
            element.options.forEach(option => {
                formControls.push(React.createElement('label', {
                    className: 'eachRadio datePickerOptions'
                }, [
                    React.createElement('input', {
                        type: 'radio',
                        name: element.parameters.name,
                        value: option.value,
                        checked: currentValue.value === option.value,
                        onChange: this.handleChange.bind(this),
                        style: { display: 'none' }
                    }),
                    React.createElement('span', {
                        className: 'eachRadio-label'
                    }, translate(datePickerWidgetMap[option.text]) || translate(option.text))
                ]));
            });
        }

        let hintText = null;
        if (!isUndefined(element.hint) && element.hint.trim().replace(/(<([^>]+)>)/ig, '') !== '') {
            if (!!element.hint && this.state.hiddenHintTexts.indexOf(element.attributes.name) === -1) {
                let clearHint = element.hint.trim().replace(/\n/g, ' ');
                clearHint = clearHint.replace('<p>', '').replace('</p>', '');
                clearHint = clearHint.replaceAll(/<br\s?\/?>/g, '<br>');
                hintText = (<p dangerouslySetInnerHTML={{ __html: translate(clearHint) }} style={{ color: '#b39d83' }} />);
            }
        }

        let questionLine = (
            <div className="line">
                <div className="column two seven">
                    <label
                        htmlFor={element?.attributes?.id}
                        style={{ color: '#564632', fontWeight: 'bold' }}
                    >
                        {translate(element.label)}
                    </label>
                </div>
                <div className="column five seven">
                    {formControls}
                    {hintText}
                </div>
            </div>
        );
        if (isUndefined(element.label)) {
            questionLine = (
                <div className="line">
                    <div className="column seven seven">
                        {formControls}
                        {hintText}
                    </div>
                </div>
            );
        } else if (element.parameters && element.parameters.type === 'toggle' && element.parameters.toggleIsRight) {
            questionLine = (
                <div className="line" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <div
                        className="column one"
                    >
                        <div className="column">
                            <label
                                htmlFor={element?.attributes?.id}
                                style={{ color: '#564632', fontWeight: 'bold', padding: '0px' }}
                            >
                                {translate(element.label)}
                            </label>
                        </div>
                        <div className="column" style={{ marginTop: '3px' }}>
                            {hintText}
                        </div>
                    </div>
                    <div className="column one two" style={{ display: 'flex', justifyContent: 'end' }}>
                        {formControls}
                    </div>
                </div>
            );
        }
        return questionLine;
    }
}

ConfigurationForm.propTypes = {
    schema: PropTypes.array.isRequired,
    conditions: PropTypes.array,
    formID: PropTypes.string,
    user: PropTypes.object,
    questions: PropTypes.array,
    onValuesChange: PropTypes.func,
    isCardBuilder: PropTypes.bool,
    isNewDefaultTheme: PropTypes.bool
};

export default ConfigurationForm;
