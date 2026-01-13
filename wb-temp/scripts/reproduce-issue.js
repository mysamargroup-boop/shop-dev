
const fetch = require('node-fetch'); // Assuming node-fetch is available or using Node 18+ native fetch

console.log("--- Simulating Phone Number Validation Logic ---");

// The problematic logic currently in production (inferred from code):
function currentValidation(phone) {
    const cleanedPhone = String(phone).replace(/[^0-9]/g, "");
    if (cleanedPhone.length !== 10) {
        return "❌ Error: Invalid phone number format. Must be 10 digits.";
    }
    return "✅ Success";
}

// The proposed fix:
function fixedValidation(phone) {
    let cleanedPhone = String(phone).replace(/[^0-9]/g, "");
    
    // Handle 12 digit numbers starting with 91
    if (cleanedPhone.length === 12 && cleanedPhone.startsWith('91')) {
      cleanedPhone = cleanedPhone.substring(2);
    }

    if (cleanedPhone.length !== 10) {
        return "❌ Error: Invalid phone number format. Must be 10 digits.";
    }
    const finalPhone = `91${cleanedPhone}`;
    return `✅ Success: ${finalPhone}`;
}

const inputFromCheckout = "919876543210"; // This is what WhatsAppCheckoutModal sends

console.log(`\nInput: ${inputFromCheckout}`);
console.log(`Current Logic: ${currentValidation(inputFromCheckout)}`);
console.log(`Fixed Logic:   ${fixedValidation(inputFromCheckout)}`);

const inputFromAdmin = "9876543210"; // This might be what works in Admin if manually entered
console.log(`\nInput: ${inputFromAdmin}`);
console.log(`Current Logic: ${currentValidation(inputFromAdmin)}`);
console.log(`Fixed Logic:   ${fixedValidation(inputFromAdmin)}`);
