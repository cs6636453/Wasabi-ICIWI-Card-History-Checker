# ICIWI Card History Checker

A web application for checking transaction history and balance of ICIWI transit cards used in the Minecraft Limaru City Server roleplay environment.

## 🎯 Overview

This web application allows players to view their ICIWI card transaction history, including:
- Transit trips and journeys
- Payment transactions at merchants
- Card balance and expiry information
- Detailed trip histories with stations and fares

**Note:** This application is made for the Minecraft Limaru City Server. It's for roleplay purposes only and has no relation to real-life resources.

## 🎫 Supported Cards

The system supports the following ICIWI card types:
- **Wasabi Cards** (cards starting with "B")
- **Pancard** (cards starting with "B")
- **Mizuno Debit Cards** (all variants)
- Any ICIWI cards issued in Limaru

Card numbers follow the format: `Bx-xxxxx` (e.g., `BA-21007`)

## ✨ Features

### Card Binding
- Bind your ICIWI card to your browser using cookies
- Persistent card information across sessions
- Easy card unbinding when needed

### Transaction History
Two main views for your card activity:

1. **Trip Details (Transit History)**
   - View all your transit journeys
   - See entry and exit stations
   - Check fare deductions
   - Track trip dates and times
   - Visual trip route display

2. **Other Transactions (Payment History)**
   - Card issuance records
   - Top-up transactions
   - Merchant payments (stores, cinema, education)
   - Card refunds
   - Transaction timestamps and amounts

### Card Information Display
- Current balance (in £)
- Card expiry date
- Card holder name
- Card number
- Card type identification

### User Interface
- **Mobile-first design** - Optimized for all devices
- **Responsive layout** - Works on desktop and mobile browsers
- **Modern UI** - Clean interface with Material Design icons
- **Real-time loading** - Shows loading indicators while fetching data

## 🚀 Usage

### Binding Your Card

1. Visit the application at: `https://app.wasabi.winsanmwtv.me/bind_card/`
2. Enter your card number (without the leading "B")
   - Example: For card `BA-21007`, enter `A-21007`
3. Click "Bind this card"
4. You'll be redirected to the main dashboard

### Viewing Your History

After binding your card:
- **Trip Details tab**: View your transit history
- **Other Transactions tab**: View payments and other transactions
- **Account icon**: Access card settings and unbind option

### Unbinding Your Card

1. Click the account/gear icon in the navigation
2. Click "Unbind card" button
3. Confirm the action
4. You'll be redirected to bind a new card

## 🛠️ Technical Details

### File Structure

```
├── index.html              # Main entry point (redirects to hosted version)
├── tmp.html                # Local version of main application
├── iciwi.html              # Legacy transit query page
├── bind_card/
│   └── index.html          # Card binding interface
├── assets/
│   ├── scripts/
│   │   ├── bind_card.js           # Card binding logic
│   │   ├── unbind_card.js         # Card unbinding logic
│   │   ├── page_control.js        # Navigation and page switching
│   │   ├── card_render.js         # Card display rendering
│   │   └── log_display/
│   │       ├── fetch_log.js       # Main data fetching
│   │       ├── fetch_log_iciwi.js # ICIWI-specific fetching
│   │       ├── payment.js         # Payment data processing
│   │       ├── transit.js         # Transit data processing
│   │       ├── render.js          # UI rendering
│   │       └── pancard.js         # Pancard utilities
│   ├── stylesheets/
│   │   └── template.css           # Main stylesheet
│   ├── images/                    # Image assets
│   └── favicon.png                # Application icon
└── Iciwi/
    └── iciwi.log                  # Transaction log data
```

### Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with flexbox/grid
- **Vanilla JavaScript** - No frameworks, pure JS
- **Google Fonts** - Poppins font family
- **Material Symbols** - Icon library
- **Cookies** - Client-side card storage

### Data Format

Transaction logs are stored in JSON format with the following structure:

```json
{
  "timestamp": "2025-05-04 22:09:42",
  "level": "INFO",
  "message": "new-card",
  "data": {
    "serial": "BA-21007",
    "player": "c4c9b1f3-f3ce-40be-9c59-79b62ef4e852",
    "value": 10.0
  }
}
```

### Message Types

- `new-card` - Card issuance
- `card-entry` - Transit entry at station
- `card-exit` - Transit exit at station
- `top-up-card` - Balance top-up
- `refund-card` - Card refund
- `merchant-payment` - Payment at merchants

## 🌐 Deployment

The application is hosted at:
- **Main App**: `https://bluemap.limaru.net/iciwi/`
- **Card Binding**: `https://app.wasabi.winsanmwtv.me/bind_card/`
- **Custom Domain**: `app.wasabi.winsanmwtv.me`

### Hosting
- Platform: GitHub Pages
- Custom domain configured via CNAME

## 🔒 Privacy & Data

- Card numbers are stored locally in browser cookies
- Cookie persistence: ~100 years (36,500 days)
- By binding a card, you agree to store the card number in cookies
- No sensitive data is transmitted to external servers (except for Minecraft username resolution)

## 🎮 Minecraft Integration

This application integrates with the Limaru City Minecraft server:
- Resolves player UUIDs to usernames via Ashcon API
- Displays roleplay transaction data from server logs
- Supports various in-game merchants and transit systems

### Supported Locations

#### Transit Stations
- Downtown
- Various metro/train stations

#### Merchants
- **CINEMARU** - Cinema/entertainment
- **KONNO UNIVERSITY** - Educational institutions
- **IICP** - Various merchants
- And more...

## 📱 Browser Compatibility

- ✅ Modern Chrome/Chromium browsers
- ✅ Firefox
- ✅ Safari (iOS and macOS)
- ✅ Edge
- ⚠️ Internet Explorer - Not supported

### Mobile Features
- Touch-optimized interface
- Viewport locked for optimal mobile experience
- Responsive navigation
- Context menu disabled for cleaner UX

## 🚧 Known Limitations

- Only cards starting with "B" are currently supported
- Only one card can be bound at a time per browser
- Right-click context menu is disabled
- Zoom/scaling is restricted on mobile devices

## 💡 Future Enhancements

Potential features for future development:
- Support for multiple card binding
- Export transaction history
- Advanced filtering and search
- Statistics and analytics
- Push notifications for transactions

## 🤝 Contributing

This is a roleplay application for Minecraft Limaru City Server. For issues, suggestions, or contributions, please contact the TJT (Transit and Transport) team on the server.

## 📄 License

This project is created for the Minecraft Limaru City Server community.

## 👥 Credits

- **Development**: TJT (Transit and Transport) Team
- **Server**: Limaru City Minecraft Server
- **Icons**: Google Material Symbols
- **Fonts**: Google Fonts (Poppins)

## 📞 Support

If you encounter issues:
1. Try unbinding and rebinding your card
2. Clear your browser cookies and cache
3. Contact the TJT team on the Limaru server
4. Check if your card number is correct and starts with "B"

---

**Disclaimer**: This is a roleplay application for a Minecraft server. All transactions, cards, and currency (£) are virtual and have no real-world value or connection to actual financial systems.
