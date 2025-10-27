# Wasabi ICIWI Card History Checker

A web application for checking ICIWI card transaction history and transit details for Minecraft Limaru City Server. This tool allows users to bind their IC cards (Wasabi, pancard, or Mizuno Debit Cards) and view their trip history and transactions.

## 🚀 Features

- **Card Binding**: Securely bind your ICIWI card using cookie storage
- **Transit History**: View detailed trip information including:
  - Entry and exit stations
  - Transit times
  - Fare calculations
  - OSI (Out-of-Station Interchange) discounts
- **Transaction History**: Track all card transactions including:
  - Card issuance
  - Top-ups
  - Merchant payments
  - Refunds
- **Mobile-First Design**: Responsive interface optimized for both mobile and desktop
- **Real-Time Balance**: Check your current card balance and expiry date

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Fonts**: Google Fonts (Poppins, Material Symbols)
- **Storage**: Browser cookies for card binding
- **Design**: Mobile-first responsive design

## 📁 Project Structure

```
Wasabi-ICIWI-Card-History-Checker/
├── assets/
│   ├── favicon.png
│   ├── images/
│   │   ├── pancard.png
│   │   └── wasabi_pancard.png
│   ├── scripts/
│   │   ├── bind_card.js          # Card binding logic
│   │   ├── card_render.js        # Card display rendering
│   │   ├── page_control.js       # Page navigation
│   │   ├── unbind_card.js        # Card unbinding logic
│   │   └── log_display/          # Transaction log processing
│   │       ├── fetch_log.js
│   │       ├── fetch_log_iciwi.js
│   │       ├── payment.js
│   │       ├── transit.js
│   │       ├── render.js
│   │       └── pancard.js
│   └── stylesheets/
│       └── template.css          # Main stylesheet
├── bind_card/
│   └── index.html                # Card binding page
├── index.html                    # Main entry point (redirects)
├── tmp.html                      # Transit query page
└── iciwi.html                    # ICIWI transit query form
```

## 💳 Supported Cards

- **Wasabi Card**: Cards starting with "B"
- **pancard**: Cards starting with "B"
- **Mizuno Debit Card**: All cards issued
- **ICIWI Cards**: All cards issued in Limaru

Card format: `Bx-xxxxx` (where x is a letter followed by 1-5 digits)

## 🌐 Live Demo

Visit: [app.wasabi.winsanmwtv.me](https://app.wasabi.winsanmwtv.me)

Alternative: [bluemap.limaru.net/iciwi/](https://bluemap.limaru.net/iciwi/)

## 🎮 Usage

1. **Bind Your Card**:
   - Navigate to the card binding page
   - Enter your card number (format: `x-xxxxx`)
   - The system automatically adds "B" prefix
   - Click "Bind this card"

2. **View Transit History**:
   - After binding, navigate to "Trip details" tab
   - View your entry/exit stations
   - Check fare calculations and any discounts

3. **Check Transactions**:
   - Navigate to "Other transactions" tab
   - View all payment history
   - Track top-ups, purchases, and refunds

4. **Unbind Card**:
   - Go to account settings
   - Click "Unbind card"
   - Confirm the action

## ⚠️ Important Notes

- This web application is made for **Minecraft Limaru City Server** roleplay purposes
- All data and transactions are for **roleplay only** and have no real-life monetary value
- The system uses browser cookies to store your card number
- Only one card can be bound at a time in the testing system
- Only cards starting with "B" are currently supported

## 🔒 Privacy

- Card numbers are stored locally in browser cookies
- Cookie expiration: ~100 years (36,500 days)
- No personal or real financial information is collected
- All data is for Minecraft roleplay purposes only

## 📱 Browser Compatibility

- Modern browsers with JavaScript enabled
- Cookie support required
- Mobile-responsive design
- Right-click context menu disabled for UI protection

## 🤝 Contributing

This is a roleplay project for Minecraft Limaru City Server. For issues or suggestions, please contact the server administration (TJT).

## 📄 License

This project is part of the Minecraft Limaru City Server roleplay ecosystem.

---

**Made for Minecraft Limaru City Server** | **For Roleplay Purposes Only**
