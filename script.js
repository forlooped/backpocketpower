let currentStep = 0; // Current step is 0
const steps = document.getElementsByClassName("form-step");
const stepIndicators = document.getElementsByClassName("step-indicator");
const prevButton = document.getElementById("prevBtn");
const nextButton = document.getElementById("nextBtn");
const submitButton = document.getElementById("submitBtn"); // Renamed from submitBtn for clarity
const form = document.getElementById("contactForm");

// EmailJS Configuration
const EMAILJS_PUBLIC_KEY = 'vMhsvwHn1MFag9xE4';
const EMAILJS_SERVICE_ID = 'service_64s9ffx';
const EMAILJS_TEMPLATE_ID = 'template_t1bkgkv';

emailjs.init(EMAILJS_PUBLIC_KEY);

document.addEventListener("DOMContentLoaded", function() {
    showStep(currentStep);

    if(prevButton) {
        prevButton.addEventListener("click", () => nextPrev(-1));
    }
    if(nextButton) {
        nextButton.addEventListener("click", () => nextPrev(1));
    }
    if(submitButton) { // This is the final submit button
        submitButton.addEventListener("click", function(event) {
            event.preventDefault();
            if (!validateForm()) { // Validate the last step before submitting
                return false;
            }
            submitForm();
        });
    }
    if(form) {
        form.addEventListener("submit", function(event) {
            event.preventDefault();
            // This ensures that if the form is submitted by pressing Enter on the last field
            // (though our setup tries to prevent this by having a button of type "button" vs "submit" for "Next")
            // or if the "Next" button somehow submits the form, we still go through our logic.
            // In our current setup, only the #submitBtn should trigger the final submission.
            if (currentStep === steps.length - 1) { // Only submit if on the last step
                 if (!validateForm()) {
                    return false;
                }
                submitForm();
            }
        });
    }
});

function showStep(n) {
    // Hide all steps
    for (let i = 0; i < steps.length; i++) {
        steps[i].style.display = "none";
    }

    // Display the current step
    if (steps[n]) {
        steps[n].style.display = "block";
    }

    // Update button visibility and labels
    if (document.getElementById("prevBtn")) {
        document.getElementById("prevBtn").style.display = n === 0 ? "none" : "inline";
    }
    if (document.getElementById("nextBtn")) {
        document.getElementById("nextBtn").innerHTML = n === (steps.length - 1) ? "Submit" : "Next";
        // For the very last step, the "Next" button might actually be the submit button functionality
        // or we might show a separate submit button. For now, it changes text.
        // If it's the last step, we might want to hide "Next" and show "Submit"
        if (n === (steps.length - 1)) {
             if(document.getElementById("nextBtn")) document.getElementById("nextBtn").style.display = "none";
             if(document.getElementById("submitBtn")) document.getElementById("submitBtn").style.display = "inline";
        } else {
            if(document.getElementById("nextBtn")) document.getElementById("nextBtn").style.display = "inline";
            if(document.getElementById("submitBtn")) document.getElementById("submitBtn").style.display = "none";
        }
    }
    updateStepIndicator(n);
}

function nextPrev(n) {
    // Basic validation for the current step before proceeding
    if (n > 0 && !validateForm()) {
        return false;
    }

    // Hide current step
    if (steps[currentStep]) {
        steps[currentStep].style.display = "none";
    }

    // Increment or decrement current step
    currentStep = currentStep + n;

    if (currentStep >= steps.length) {
        // If we've gone past the last step, submit the form
        // This check might be redundant if "Next" button becomes "Submit"
        submitForm();
        return false;
    }
    showStep(currentStep);
}

function validateForm() {
    let valid = true;
    const currentInputs = steps[currentStep].querySelectorAll("input[required], textarea[required], select[required]");
    
    // Clear all previous general error messages within the current step first
    const allErrorMessages = steps[currentStep].querySelectorAll(".error-message");
    allErrorMessages.forEach(msg => msg.remove());

    // Clear all previous invalid classes
    const allInvalidFields = steps[currentStep].querySelectorAll(".invalid, .invalid-group");
    allInvalidFields.forEach(field => {
        field.classList.remove("invalid");
        field.classList.remove("invalid-group");
    });

    currentInputs.forEach(input => {
        // Note: displayErrorMessage is now called within each validation block if invalid.
        // No need to remove individual error messages here as they are cleared globally at the start of validation.

        if (input.type === "radio") { // Specific handling for required radio groups
            const groupName = input.name;
            // Only process each radio group once
            if (steps[currentStep].querySelector(`input[name="${groupName}"].validation-processed`)) {
                return; // Skip if already processed
            }
            
            const groupRadios = steps[currentStep].querySelectorAll(`input[name="${groupName}"][required]`);
            if (groupRadios.length > 0) { // If any radio in the group is marked required, the group is required
                let groupChecked = false;
                const actualRadiosInGroup = steps[currentStep].querySelectorAll(`input[name="${groupName}"]`);
                actualRadiosInGroup.forEach(radio => {
                    if (radio.checked) {
                        groupChecked = true;
                    }
                    radio.classList.add("validation-processed"); // Mark as processed
                });

                if (!groupChecked) {
                    valid = false;
                    // Add invalid class to the first radio for visual feedback, or better, its container/label
                    groupRadios[0].classList.add("invalid"); 
                    displayErrorMessage(groupRadios[0].closest('.form-group') || groupRadios[0].parentNode, "Please select an option.");
                }
                
                actualRadiosInGroup.forEach(radio => radio.classList.remove("validation-processed")); // Clean up marker
            }
        } else if (input.value.trim() === "") {
            input.classList.add("invalid");
            displayErrorMessage(input, "This field is required.");
            valid = false;
        } else if (input.type === "email" && !/\S+@\S+\.\S+/.test(input.value)) {
            input.classList.add("invalid");
            displayErrorMessage(input, "Please enter a valid email address.");
            valid = false;
        }
        // Add more specific validations as needed (e.g., phone number format)
    });

    // Specific check for required checkbox groups (marked with class "required" on the group div)
    const requiredCheckboxGroups = steps[currentStep].querySelectorAll(".checkbox-group.required");
    requiredCheckboxGroups.forEach(group => {
        const checkboxes = group.querySelectorAll("input[type='checkbox']");
        let isChecked = false;
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                isChecked = true;
            }
        });
        if (!isChecked) {
            valid = false;
            group.classList.add("invalid-group"); // Add class to group for potential styling
            // Display error message for the group. Find a good place, e.g., after the group's label or the group itself.
            // Assuming the label is the first child of form-group, and checkbox-group is inside form-group.
            const formGroup = group.closest('.form-group');
            if (formGroup) {
                displayErrorMessage(formGroup, "Please select at least one option from this group.");
            } else { // Fallback if structure is different
                displayErrorMessage(group, "Please select at least one option from this group.");
            }
        } else {
            group.classList.remove("invalid-group"); // Ensure to remove if valid
        }
    });

    return valid;
}

function displayErrorMessage(elementToAttachMessageAfter, message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    
    // Insert the message after the element or its parent if it's an input inside a simple div.
    // If elementToAttachMessageAfter is a form-group or a specific group div, append to it.
    if (elementToAttachMessageAfter.classList.contains('form-group') || 
        elementToAttachMessageAfter.classList.contains('checkbox-group') || 
        elementToAttachMessageAfter.classList.contains('radio-group')) {
        elementToAttachMessageAfter.appendChild(errorDiv);
    } else if (elementToAttachMessageAfter.parentNode.classList.contains('form-group')) {
         // If it's an input/select/textarea directly within a form-group
        elementToAttachMessageAfter.parentNode.appendChild(errorDiv);
    }
     else {
        // Fallback: insert after the element itself
        elementToAttachMessageAfter.parentNode.insertBefore(errorDiv, elementToAttachMessageAfter.nextSibling);
    }
}


function updateStepIndicator(n) {
    for (let i = 0; i < stepIndicators.length; i++) {
        stepIndicators[i].classList.remove("active");
        stepIndicators[i].classList.remove("finish"); // Remove finish if we go back
    }
    // Mark all previous steps as finished
    for (let i = 0; i < n; i++) {
        if(stepIndicators[i]) stepIndicators[i].classList.add("finish");
    }
    // Mark current step as active
    if(stepIndicators[n]) stepIndicators[n].classList.add("active");
}

function submitForm() {
    // Final validation of all fields (optional, as we validate step-by-step)
    // For now, assume step-by-step validation is sufficient.
    
    // Disable submit button to prevent multiple submissions
    if(submitButton) submitButton.disabled = true;
    if(nextButton && currentStep === steps.length -1) nextButton.disabled = true; // If next button acts as submit

    console.log("Attempting to send email via EmailJS...");

    emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, "#contactForm")
        .then(function(response) {
           console.log('SUCCESS!', response.status, response.text);
           window.location.href = "thankyou.html"; // Redirect to thank you page
        }, function(error) {
           console.log('FAILED...', error);
           alert("Failed to send message. Error: " + JSON.stringify(error) + "\nPlease try again or contact us directly.");
           // Re-enable submit button if sending failed
           if(submitButton) submitButton.disabled = false;
           if(nextButton && currentStep === steps.length -1) nextButton.disabled = false;
        });
}

// Note: The event listener for the submitButton and the form itself have been moved to DOMContentLoaded
// to ensure 'contactForm' and 'submitBtn' elements are available and to consolidate event listener setup.
// The reference to 'inquiryForm' was also updated to 'contactForm' within those listeners.

