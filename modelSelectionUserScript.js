// ==UserScript==
// @name         Perplexity Model Selection
// @version      0.1
// @description  Adds a custom button to Perplexity AI using jQuery
// @author       Atik Shaikh
// @match        https://www.perplexity.ai/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Check if jQuery is loaded on the page
    if (typeof jQuery === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js';
        script.type = 'text/javascript';
        document.getElementsByTagName('head')[0].appendChild(script);

        script.onload = function() {
            setup();
        };
    } else {
        setup();
    }

    function createModelSelectorElement() {
        var $button = $('<button/>', {
            type: 'button',
            class: 'md:hover:bg-offsetPlus text-textOff dark:text-textOffDark md:hover:text-textMain dark:md:hover:bg-offsetPlusDark dark:md:hover:text-textMainDark font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-in-out font-sans select-none items-center relative group/button justify-center text-center items-center rounded-full cursor-point active:scale-95 origin-center whitespace-nowrap inline-flex text-sm px-sm font-medium h-8'
        });


        const $svg = $(`
        <svg aria-hidden="true" focusable="false" data-prefix="far" data-icon="bars-filter" class="svg-inline--fa fa-bars-filter fa-fw fa-1x " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M0 88C0 74.7 10.7 64 24 64H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H24C10.7 112 0 101.3 0 88zM64 248c0-13.3 10.7-24 24-24H360c13.3 0 24 10.7 24 24s-10.7 24-24 24H88c-13.3 0-24-10.7-24-24zM288 408c0 13.3-10.7 24-24 24H184c-13.3 0-24-10.7-24-24s10.7-24 24-24h80c13.3 0 24 10.7 24 24z"></path></svg>
        `)
        var $textDiv = $(`<div class="text-align-center relative truncate">Model</div>`);
        var $buttonContentDiv = $('<div/>', {
            class: 'flex items-center leading-none justify-center gap-xs',
        }).append($svg).append($textDiv);

        $button.append($buttonContentDiv);
        var $wrapperDiv = $('<div/>').append($('<span/>').append($button));

        return {
            $element: $wrapperDiv,
            setModelName: (modelName) => {
                $textDiv.text(`Model (${modelName})`);
            }
        }
    }

    function createSelectionPopover(sourceElement) {
        const createSelectionElement = (input) => {
            const {name, onClick} = input;
            const $element = $(`
            <div class="md:h-full">
                <div class="md:h-full">
                    <div class="relative cursor-pointer md:hover:bg-offsetPlus py-md px-sm md:p-sm rounded md:hover:dark:bg-offsetPlusDark transition-all duration-300 md:h-full -ml-sm md:ml-0 select-none rounded">
                        <div class="flex items-center justify-between relative">
                            <div class="flex items-center gap-x-xs default font-sans text-sm font-medium text-textMain dark:text-textMainDark selection:bg-superDuper selection:text-textMain">
                                <span>${name}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `);

            $element.click(onClick);
            return $element;
        }

        const popoverHTML = `<div class="flex justify-center items-center">
            <div class="ease-in-out duration-150 transition">
                <div class="absolute left-0 top-0 z-30">
                    <div data-tag="popper" data-popper-reference-hidden="false" data-popper-escaped="false" data-popper-placement="bottom-end" style="position: absolute; inset: 0px 0px auto auto;">
                        <div class="border animate-in ease-in-out fade-in zoom-in-95 duration-150 rounded shadow-sm p-xs border-borderMain/50 ring-borderMain/50 divide-borderMain/50 dark:divide-borderMainDark/50 dark:ring-borderMainDark/50 dark:border-borderMainDark/50 bg-background dark:bg-backgroundDark">
                            <div data-tag="menu" class="min-w-[160px] max-w-[250px] border-borderMain/50 ring-borderMain/50 divide-borderMain/50 dark:divide-borderMainDark/50 dark:ring-borderMainDark/50 dark:border-borderMainDark/50 bg-transparent">
                                <!-- Put elements here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        const $popover = $(popoverHTML);
        const $popper = $popover.find('[data-tag="popper"]');
        const $menuContaienr = $popover.find('[data-tag="menu"]');

        if (sourceElement) {
            const {top, left, width, height} = sourceElement.getBoundingClientRect();
            const offset = 10;
            const popperWidth = $popper.outerWidth();
            $popper.css('transform', `translate(${left + (width + popperWidth * 2)}px, ${top + height + offset}px)`);
        }

        return {
            $element: $popover,
            addSelection: (input) => {
                const $selection = createSelectionElement(input);
                $menuContaienr.append($selection);
            }
        }

    }

    async function fetchSettings() {
        const url = 'https://www.perplexity.ai/p/api/v1/user/settings';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch settings');
        return await response.json();
    }

    function setupSelection() {
        const $focusElement = $('div:contains("Focus")').closest('.flex.bg-background.dark\\:bg-offsetDark.rounded-l-lg.col-start-1.row-start-2.-ml-2');
        if (!$focusElement.length) return;

        if ($focusElement.data('state') === 'injected') return;
        $focusElement.data('state', 'injected');

        const models = [
            {
                "name": "Default",
                "code": "turbo"
            },
            {
                "name": "Experimental",
                "code": "experimental"
            },
            {
                "name": "GPT-4 Turbo",
                "code": "gpt4"
            },
            {
                "name": "Claude 3",
                "code": "claude2"
            },
            {
                "name": "Mistral Large",
                "code": "mistral"
            }
        ];

        const modelSelector = createModelSelectorElement();

        let latestSettings = undefined;
        const getCurrentModel = () => {
            return latestSettings?.["default_model"];
        }
        const updateFromSettings = () => {
            fetchSettings().then((settings) => {
                latestSettings = settings;
                const modelCode = getCurrentModel();
                const modelName = models.find(m => m.code === modelCode)?.name;
                if (modelName) modelSelector.setModelName(modelName);
            });
        };
        updateFromSettings();

        const setModel = async (model) => {
            const el = $focusElement[0];
            const fiberKey = Object.keys(el).find(k => k.startsWith('__reactFiber'));
            if (!fiberKey) throw new Error('Failed to find key of React Fiber');
            const fiber = el[fiberKey];
            return await fiber.child.sibling.memoizedProps.socket.emitWithAck('save_user_settings', {
                default_model: model,
                source: "default",
                version: "2.5"
            })
        }

        modelSelector.$element.click(async () => {
            const {$element: $popover, addSelection} = createSelectionPopover(modelSelector.$element[0]);
            $('main').append($popover);
            const closePopover = () => {
                $popover.remove();
                $(document).off('click', closePopover);
            }
            for (const model of models) {
                addSelection({
                    name: model.name,
                    onClick: async () => {
                        await setModel(model.code);
                        updateFromSettings();
                        closePopover();
                    }
                });
            }

            setTimeout(() => {
                $(document).on('click', closePopover);
                $popover.on('click', (e) => e.stopPropagation());
            }, 500);
        });

        $focusElement.append(modelSelector.$element);
    }

    function setup() {
        setupSelection();
        setInterval(() => {
            setupSelection();
        }, 500);
    }
})();
