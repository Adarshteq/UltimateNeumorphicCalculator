
document.addEventListener('DOMContentLoaded', function() {
    // Calculator elements
    const keys = document.querySelectorAll("#calc .neumorphic:not(.scientific-toggle)");
    const display = document.querySelector(".display");
    const historyDisplay = document.querySelector(".history");
    const liveResult = document.querySelector(".live-result");
    const operators = ["+", "-", "×", "÷", "%"];
    let decimalAdded = false;
    let memory = 0;
    let isScientificMode = false;
    let calculationHistory = JSON.parse(localStorage.getItem('calcHistory')) || [];
    let accentColor = localStorage.getItem('accentColor') || '#5d9cec';
    let chart = null;
    
    // Theme switch
    const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
    
    // UI elements
    const scientificToggle = document.querySelector('.scientific-toggle');
    const calculator = document.querySelector('.calculator');
    const scientificButtons = document.querySelector('.scientific-buttons');
    const colorPicker = document.getElementById('accentColor');
    const historySidebar = document.getElementById('historySidebar');
    const historyList = document.getElementById('historyList');
    const showHistoryBtn = document.getElementById('showHistory');
    const closeSidebar = document.querySelector('.close-sidebar');
    const clearHistoryBtn = document.querySelector('.clear-history');
    const unitConverterBtn = document.getElementById('unitConverter');
    const unitConverterPanel = document.querySelector('.unit-converter-panel');
    const closeConverter = document.querySelector('.close-converter');
    const graphBtn = document.querySelector('.graph');
    const graphContainer = document.querySelector('.graph-container');
    const closeGraph = document.querySelector('.close-graph');
    const plotButton = document.querySelector('.plot-button');
    const graphFunction = document.getElementById('graphFunction');
    const graphCanvas = document.getElementById('graphCanvas');
    const voiceInputBtn = document.getElementById('voiceInput');
    const voiceOutputBtn = document.getElementById('voiceOutput');
    
    // Initialize UI
    initCalculator();
    
    function initCalculator() {
        // Set saved theme
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme) {
            document.documentElement.setAttribute("data-theme", currentTheme);
            if (currentTheme === "dark") {
                toggleSwitch.checked = true;
            }
        }
        
        // Set saved scientific mode
        const savedMode = localStorage.getItem('scientificMode');
        if (savedMode === "true") {
            toggleScientificMode();
        }
        
        // Set accent color
        colorPicker.value = accentColor;
        updateAccentColor(accentColor);
        
        // Load history
        renderHistory();
        
        // Initialize live evaluation
        updateLiveResult();
    }
    
    // Toggle scientific mode
    function toggleScientificMode() {
        isScientificMode = !isScientificMode;
        calculator.classList.toggle('scientific-mode', isScientificMode);
        scientificToggle.textContent = isScientificMode ? "Standard" : "Scientific";
        localStorage.setItem('scientificMode', isScientificMode);
    }
    
    scientificToggle.addEventListener('click', toggleScientificMode);
    
    // Theme switch functionality
    function switchTheme(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute("data-theme", "light");
            localStorage.setItem('theme', 'light');
        }
    }
    
    toggleSwitch.addEventListener("change", switchTheme, false);
    
    // Color picker functionality
    colorPicker.addEventListener('input', function() {
        accentColor = this.value;
        updateAccentColor(accentColor);
        localStorage.setItem('accentColor', accentColor);
    });
    
    function updateAccentColor(color) {
        document.documentElement.style.setProperty('--accent-color', color);
        
        // Calculate hover color
        const hoverColor = shadeColor(color, -20);
        document.documentElement.style.setProperty('--accent-hover', hoverColor);
    }
    
    function shadeColor(color, percent) {
        let R = parseInt(color.substring(1, 3), 16);
        let G = parseInt(color.substring(3, 5), 16);
        let B = parseInt(color.substring(5, 7), 16);
        
        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);
        
        R = (R < 255) ? R : 255;
        G = (G < 255) ? G : 255;
        B = (B < 255) ? B : 255;
        
        const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
        const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
        const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));
        
        return "#" + RR + GG + BB;
    }
    
    // History sidebar
    showHistoryBtn.addEventListener('click', function() {
        historySidebar.style.transform = 'translateX(0)';
    });
    
    closeSidebar.addEventListener('click', function() {
        historySidebar.style.transform = 'translateX(-100%)';
    });
    
    clearHistoryBtn.addEventListener('click', function() {
        calculationHistory = [];
        localStorage.setItem('calcHistory', JSON.stringify(calculationHistory));
        renderHistory();
    });
    
    function renderHistory() {
        historyList.innerHTML = '';
        calculationHistory.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.expression} = ${item.result}`;
            li.addEventListener('click', function() {
                display.textContent = item.result;
                updateLiveResult();
            });
            historyList.appendChild(li);
        });
    }
    
    function addToHistory(expression, result) {
        // Limit history to 50 items
        if (calculationHistory.length >= 50) {
            calculationHistory.shift();
        }
        
        calculationHistory.push({
            expression: expression,
            result: result,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('calcHistory', JSON.stringify(calculationHistory));
        renderHistory();
    }
    
    // Unit converter
    unitConverterBtn.addEventListener('click', function() {
        unitConverterPanel.style.display = 'flex';
    });
    
    closeConverter.addEventListener('click', function() {
        unitConverterPanel.style.display = 'none';
    });
    
    const converterCategory = document.getElementById('converterCategory');
    const converterFrom = document.getElementById('converterFrom');
    const converterTo = document.getElementById('converterTo');
    const converterInput = document.getElementById('converterInput');
    const converterOutput = document.getElementById('converterOutput');
    const convertButton = document.querySelector('.convert-button');
    
    // Update unit options when category changes
    converterCategory.addEventListener('change', function() {
        const category = this.value;
        let fromOptions = '';
        let toOptions = '';
        
        switch(category) {
            case 'temperature':
                fromOptions = '<option value="celsius">°C</option><option value="fahrenheit">°F</option><option value="kelvin">K</option>';
                toOptions = '<option value="fahrenheit">°F</option><option value="celsius">°C</option><option value="kelvin">K</option>';
                break;
            case 'length':
                fromOptions = '<option value="meters">m</option><option value="kilometers">km</option><option value="centimeters">cm</option><option value="miles">mi</option><option value="feet">ft</option><option value="inches">in</option>';
                toOptions = '<option value="kilometers">km</option><option value="meters">m</option><option value="centimeters">cm</option><option value="miles">mi</option><option value="feet">ft</option><option value="inches">in</option>';
                break;
            case 'weight':
                fromOptions = '<option value="kilograms">kg</option><option value="grams">g</option><option value="pounds">lb</option><option value="ounces">oz</option>';
                toOptions = '<option value="grams">g</option><option value="kilograms">kg</option><option value="pounds">lb</option><option value="ounces">oz</option>';
                break;
            case 'area':
                fromOptions = '<option value="sqmeters">m²</option><option value="sqkilometers">km²</option><option value="hectares">ha</option><option value="acres">acres</option><option value="sqfeet">ft²</option>';
                toOptions = '<option value="sqkilometers">km²</option><option value="sqmeters">m²</option><option value="hectares">ha</option><option value="acres">acres</option><option value="sqfeet">ft²</option>';
                break;
            case 'volume':
                fromOptions = '<option value="liters">L</option><option value="milliliters">mL</option><option value="gallons">gal</option><option value="pints">pt</option><option value="cubicmeters">m³</option>';
                toOptions = '<option value="milliliters">mL</option><option value="liters">L</option><option value="gallons">gal</option><option value="pints">pt</option><option value="cubicmeters">m³</option>';
                break;
        }
        
        converterFrom.innerHTML = fromOptions;
        converterTo.innerHTML = toOptions;
    });
    
    convertButton.addEventListener('click', function() {
        const value = parseFloat(converterInput.value);
        if (isNaN(value)) {
            converterOutput.value = 'Invalid';
            return;
        }
        
        const fromUnit = converterFrom.value;
        const toUnit = converterTo.value;
        const category = converterCategory.value;
        let result;
        
        switch(category) {
            case 'temperature':
                result = convertTemperature(value, fromUnit, toUnit);
                break;
            case 'length':
                result = convertLength(value, fromUnit, toUnit);
                break;
            case 'weight':
                result = convertWeight(value, fromUnit, toUnit);
                break;
            case 'area':
                result = convertArea(value, fromUnit, toUnit);
                break;
            case 'volume':
                result = convertVolume(value, fromUnit, toUnit);
                break;
            default:
                result = 'Error';
        }
        
        converterOutput.value = result.toFixed(6);
    });
    
    function convertTemperature(value, from, to) {
        // Convert to Celsius first
        let celsius;
        switch(from) {
            case 'celsius':
                celsius = value;
                break;
            case 'fahrenheit':
                celsius = (value - 32) * 5/9;
                break;
            case 'kelvin':
                celsius = value - 273.15;
                break;
        }
        
        // Convert from Celsius to target
        switch(to) {
            case 'celsius':
                return celsius;
            case 'fahrenheit':
                return (celsius * 9/5) + 32;
            case 'kelvin':
                return celsius + 273.15;
            default:
                return value;
        }
    }
    
    function convertLength(value, from, to) {
        // Conversion factors to meters
        const toMeters = {
            meters: 1,
            kilometers: 1000,
            centimeters: 0.01,
            miles: 1609.344,
            feet: 0.3048,
            inches: 0.0254
        };
        
        // Convert to meters first
        const meters = value * toMeters[from];
        
        // Convert to target unit
        return meters / toMeters[to];
    }
    
    function convertWeight(value, from, to) {
        // Conversion factors to kilograms
        const toKilograms = {
            kilograms: 1,
            grams: 0.001,
            pounds: 0.453592,
            ounces: 0.0283495
        };
        
        // Convert to kilograms first
        const kg = value * toKilograms[from];
        
        // Convert to target unit
        return kg / toKilograms[to];
    }
    
    function convertArea(value, from, to) {
        // Conversion factors to square meters
        const toSqMeters = {
            sqmeters: 1,
            sqkilometers: 1000000,
            hectares: 10000,
            acres: 4046.86,
            sqfeet: 0.092903
        };
        
        // Convert to square meters first
        const sqMeters = value * toSqMeters[from];
        
        // Convert to target unit
        return sqMeters / toSqMeters[to];
    }
    
    function convertVolume(value, from, to) {
        // Conversion factors to liters
        const toLiters = {
            liters: 1,
            milliliters: 0.001,
            gallons: 3.78541,
            pints: 0.473176,
            cubicmeters: 1000
        };
        
        // Convert to liters first
        const liters = value * toLiters[from];
        
        // Convert to target unit
        return liters / toLiters[to];
    }
    
    // Graph plotting
    graphBtn.addEventListener('click', function() {
        graphContainer.style.display = 'flex';
        graphFunction.value = '';
        if (chart) {
            chart.destroy();
            chart = null;
        }
    });
    
    closeGraph.addEventListener('click', function() {
        graphContainer.style.display = 'none';
    });
    
    plotButton.addEventListener('click', function() {
        plotGraph();
    });
    
    graphFunction.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            plotGraph();
        }
    });
    
    function plotGraph() {
        const funcStr = graphFunction.value.replace(/^y\s*=\s*/i, '');
        if (!funcStr) return;
        
        const ctx = graphCanvas.getContext('2d');
        if (chart) chart.destroy();
        
        // Generate data points
        const data = [];
        const step = 0.1;
        
        for (let x = -10; x <= 10; x += step) {
            try {
                // Create a safe evaluation context
                const y = evaluateExpression(funcStr, {x: x});
                if (!isNaN(y) && isFinite(y)) {
                    data.push({x: x, y: y});
                }
            } catch (e) {
                console.error("Error evaluating function:", e);
            }
        }
        
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: `y = ${funcStr}`,
                    data: data,
                    borderColor: accentColor,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'center',
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'center',
                        grid: {
                            color: 'rgba(200, 200, 200, 0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: accentColor
                        }
                    }
                }
            }
        });
    }
    
    // Voice input/output
    let recognition = null;
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            processVoiceCommand(transcript);
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error', event.error);
        };
    }
    
    voiceInputBtn.addEventListener('click', function() {
        if (recognition) {
            recognition.start();
            this.classList.add('active');
        } else {
            display.textContent = "Voice not supported";
        }
    });
    
    voiceOutputBtn.addEventListener('click', function() {
        speakText(display.textContent);
    });
    
    function processVoiceCommand(command) {
        command = command.toLowerCase().trim();
        
        // Handle special commands
        if (command.includes('clear')) {
            display.textContent = '';
            historyDisplay.textContent = '';
            decimalAdded = false;
            return;
        }
        
        if (command.includes('equals') || command.includes('equal')) {
            document.querySelector('.equals').click();
            return;
        }
        
        // Map voice commands to buttons
        const commandMap = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
            'plus': '+', 'minus': '-', 'times': '×', 'multiply': '×', 
            'divide': '÷', 'percent': '%', 'point': '.', 'decimal': '.',
            'pi': 'π', 'square root': '√', 'power': 'x^y', 'factorial': 'x!',
            'log': 'log', 'natural log': 'ln', 'exponent': 'e^x',
            'sine': 'sin', 'cosine': 'cos', 'tangent': 'tan'
        };
        
        let found = false;
        for (const [key, value] of Object.entries(commandMap)) {
            if (command.includes(key)) {
                // Find the button with this text
                const buttons = document.querySelectorAll('.neumorphic');
                buttons.forEach(button => {
                    if (button.textContent === value) {
                        button.click();
                        found = true;
                    }
                });
            }
        }
        
        if (!found) {
            // Direct number input
            const numbers = command.match(/\d+/g);
            if (numbers) {
                numbers.forEach(num => {
                    display.textContent += num;
                });
            }
        }
        
        voiceInputBtn.classList.remove('active');
    }
    
    function speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    }
    
    // Memory functions
    function handleMemory(operation) {
        const currentValue = parseFloat(display.textContent) || 0;
        
        switch(operation) {
            case 'MC':
                memory = 0;
                break;
            case 'MR':
                display.textContent = memory;
                decimalAdded = display.textContent.includes('.');
                break;
            case 'M+':
                memory += currentValue;
                break;
            case 'M-':
                memory -= currentValue;
                break;
        }
        
        // Visual feedback
        const memoryBtn = document.querySelector(`.${operation.toLowerCase()}`);
        memoryBtn.classList.add('button-press');
        setTimeout(() => {
            memoryBtn.classList.remove('button-press');
        }, 200);
    }
    
    // Add ripple effect to buttons
    function createRipple(event) {
        const button = event.currentTarget;
        const ripple = document.createElement("span");
        ripple.className = "ripple-effect";
        
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        
        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
        ripple.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Live expression evaluation
    function updateLiveResult() {
        let equation = display.textContent;
        
        // Handle special cases
        if (!equation || equation === "Error") {
            liveResult.textContent = "";
            return;
        }
        
        // Replace operators for eval
        equation = equation.replace(/×/g, "*").replace(/÷/g, "/");
        
        // Remove last character if it's an operator or decimal
        const lastChar = equation[equation.length - 1];
        if (operators.includes(lastChar) || lastChar === ".") {
            equation = equation.slice(0, -1);
        }
        
        if (equation) {
            try {
                const result = evaluateExpression(equation);
                liveResult.textContent = "= " + parseFloat(result.toFixed(10)).toString();
            } catch (e) {
                liveResult.textContent = "";
            }
        } else {
            liveResult.textContent = "";
        }
    }
    
    // Safe expression evaluation
    function evaluateExpression(expr, variables = {}) {
        // Create a safe evaluation context
        const context = {
            Math: Math,
            PI: Math.PI,
            E: Math.E,
            sin: Math.sin,
            cos: Math.cos,
            tan: Math.tan,
            sqrt: Math.sqrt,
            log: Math.log10,
            ln: Math.log,
            exp: Math.exp,
            pow: Math.pow,
            ...variables
        };
        
        // Replace scientific notations
        expr = expr.replace(/(\d+)! /g, 'factorial($1)')
                  .replace(/(\w+)\^(\w+)/g, 'pow($1, $2)')
                  .replace(/π/g, 'PI')
                  .replace(/e/g, 'E');
        
        // Create function from expression
        const safeEval = Function(...Object.keys(context), 
            `return (${expr});`
        ).bind(null, ...Object.values(context));
        
        return safeEval();
    }
    
    // Factorial function
    function factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
    
    // Haptic feedback
    function vibrate() {
        if ("vibrate" in navigator) {
            navigator.vibrate(10);
        }
    }
    
    // Easter egg
    function checkEasterEgg(input) {
        if (input === "5318008") {
            calculator.classList.add('flip-effect');
            setTimeout(() => {
                calculator.classList.remove('flip-effect');
            }, 1500);
            return true;
        }
        return false;
    }
    
    // Calculator logic
    keys.forEach(key => {
        key.addEventListener('click', function(e) {
            createRipple(e);
            vibrate();
            
            const inputVal = display.textContent;
            const btnVal = this.textContent;
            
            // Easter egg check
            if (checkEasterEgg(inputVal + btnVal)) return;
            
            // Handle memory buttons
            if (['MC', 'MR', 'M+', 'M-'].includes(btnVal)) {
                handleMemory(btnVal);
                return;
            }
            
            // Handle graph button
            if (btnVal === 'Graph') {
                graphBtn.click();
                return;
            }
            
            // Handle scientific functions
            if (isScientificMode && ['sin', 'cos', 'tan', '√', 'x^y', 'π', 'x!', 'log', 'ln', 'e^x'].includes(btnVal)) {
                handleScientificFunction(btnVal, inputVal);
                updateLiveResult();
                return;
            }
            
            // Standard calculator functions
            if (btnVal === "C") {
                display.textContent = "";
                historyDisplay.textContent = "";
                decimalAdded = false;
            } 
            else if (btnVal === "=") {
                let equation = inputVal;
                const lastChar = equation[equation.length - 1];
                
                // Replace operators for eval
                equation = equation.replace(/×/g, "*").replace(/÷/g, "/");
                
                // Remove last character if it's an operator or decimal
                if (operators.includes(lastChar) || lastChar === ".") {
                    equation = equation.slice(0, -1);
                }
                
                if (equation) {
                    try {
                        historyDisplay.textContent = equation + " =";
                        const result = evaluateExpression(equation);
                        const resultStr = parseFloat(result.toFixed(10)).toString();
                        display.textContent = resultStr;
                        
                        // Add to history
                        addToHistory(equation, resultStr);
                        
                        // Confetti effect
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                        
                        // Speak result
                        speakText(resultStr);
                    } catch (e) {
                        display.textContent = "Error";
                    }
                }
                
                decimalAdded = false;
            } 
            else if (btnVal === "+/-") {
                if (inputVal && inputVal !== "0") {
                    display.textContent = inputVal.startsWith("-") ? 
                        inputVal.substring(1) : "-" + inputVal;
                }
            } 
            else if (operators.includes(btnVal)) {
                const lastChar = inputVal[inputVal.length - 1];
                
                if (inputVal !== "" && !operators.includes(lastChar)) {
                    display.textContent += btnVal;
                } 
                else if (inputVal === "" && btnVal === "-") {
                    display.textContent += btnVal;
                }
                
                if (operators.includes(lastChar) && inputVal.length > 1) {
                    display.textContent = inputVal.slice(0, -1) + btnVal;
                }
                
                decimalAdded = false;
            } 
            else if (btnVal === ".") {
                if (!decimalAdded) {
                    display.textContent += btnVal;
                    decimalAdded = true;
                }
            } 
            else {
                if (inputVal === "0" || inputVal === "Error") {
                    display.textContent = btnVal;
                } else {
                    display.textContent += btnVal;
                }
            }
            
            // Update live result
            updateLiveResult();
            
            // Button press animation
            this.classList.add('button-press');
            setTimeout(() => {
                this.classList.remove('button-press');
            }, 200);
        });
    });
    
    // Handle scientific functions
    function handleScientificFunction(func, inputVal) {
        let value = parseFloat(inputVal) || 0;
        let result;
        
        switch(func) {
            case 'sin':
                result = Math.sin(value * Math.PI / 180);
                break;
            case 'cos':
                result = Math.cos(value * Math.PI / 180);
                break;
            case 'tan':
                result = Math.tan(value * Math.PI / 180);
                break;
            case '√':
                result = Math.sqrt(value);
                break;
            case 'x^y':
                // For power operation, we'll wait for the second number
                display.textContent += '^';
                return;
            case 'π':
                result = Math.PI;
                break;
            case 'x!':
                result = factorial(value);
                break;
            case 'log':
                result = Math.log10(value);
                break;
            case 'ln':
                result = Math.log(value);
                break;
            case 'e^x':
                result = Math.exp(value);
                break;
        }
        
        historyDisplay.textContent = `${func}(${value}) =`;
        display.textContent = parseFloat(result.toFixed(10)).toString();
    }
    
    // Keyboard support
    document.addEventListener('keydown', function(e) {
        const keyMap = {
            '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
            '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
            '.': 'decimal', '+': 'plus', '-': 'minus', '*': 'times', '/': 'divide',
            'Enter': 'equals', '=': 'equals', 'Escape': 'c', '%': 'percent',
            'm': 'm-plus', 'M': 'm-minus', 'r': 'mr', 'R': 'mr', 'c': 'mc', 'C': 'mc',
            's': 'sin', 'S': 'sin', 'c': 'cos', 'C': 'cos', 't': 'tan', 'T': 'tan',
            'q': 'sqrt', 'Q': 'sqrt', 'p': 'pi', 'P': 'pi', '!': 'fact', 
            'l': 'log', 'L': 'log', 'n': 'ln', 'N': 'ln', 'e': 'exp', 'E': 'exp',
            'g': 'graph', 'G': 'graph'
        };
        
        const key = e.key;
        if (key in keyMap) {
            e.preventDefault();
            const button = document.querySelector(`.${keyMap[key]}`);
            if (button) button.click();
        }
    });
});