# Pool N Play

A polished web application for pool installation and services built with Node.js, Express, Mongoose, EJS, and Bootstrap 5.

## Features

### Public Pages
- **Home**: Hero section (with admin-selected image or CTA buttons), featured services, portfolio items, and contact form
- **About**: Company information page
- **Contact**: Contact form with company information and social links
- **Products**: Product listing with individual product pages
- **Portfolio**: Gallery of completed projects

### Admin Features
- **Authentication**: Secure admin login system
- **Media Library**: Upload, compress, and resize images (stored in MongoDB)
- **Services Management**: Add/edit services with Bootstrap icons
- **Projects Management**: Manage portfolio projects with SEO settings
- **Products Management**: Create products with sizes and pricing
- **Settings**: Company info, social media links, theme customization, hero image selection
- **Inquiries**: View and manage form submissions

### Forms
- Contact forms on Home, Contact, and Product pages
- Fields: Name, Town, Phone, Email, Service (dropdown), Pool Sizes (multi-select on product pages)
- Automatic email notifications to admin
- All submissions saved to database

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Views**: EJS templating
- **Styling**: Bootstrap 5
- **Email**: Nodemailer
- **Image Processing**: Sharp (compression and resizing)
- **File Upload**: Multer

## Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Update the following variables:
     ```
     MONGODB_URI=mongodb://localhost:27017/poolnplay
     SESSION_SECRET=your-secret-key-change-this
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=admin123
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=your-email@gmail.com
     SMTP_PASS=your-app-password
     EMAIL_TO=markagrover85@gmail.com
     PORT=3000
     ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Seed the database** (optional, creates sample data):
   ```bash
   npm run seed
   ```

6. **Start the server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

7. **Access the application**:
   - Public site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin/login
   - Default admin credentials: `admin` / `admin123` (change in `.env`)

## Project Structure

```
poolnplay/
├── controllers/
│   ├── adminController.js
│   └── publicController.js
├── middleware/
│   └── auth.js
├── models/
│   ├── Inquiry.js
│   ├── Media.js
│   ├── Product.js
│   ├── Project.js
│   ├── Service.js
│   └── Settings.js
├── routes/
│   ├── admin.js
│   └── public.js
├── scripts/
│   └── seed.js
├── views/
│   ├── admin/
│   │   ├── partials/
│   │   ├── dashboard.ejs
│   │   ├── inquiries.ejs
│   │   ├── login.ejs
│   │   ├── media.ejs
│   │   ├── product-form.ejs
│   │   ├── products.ejs
│   │   ├── project-form.ejs
│   │   ├── projects.ejs
│   │   ├── service-form.ejs
│   │   ├── services.ejs
│   │   └── settings.ejs
│   ├── public/
│   │   ├── about.ejs
│   │   ├── contact.ejs
│   │   ├── home.ejs
│   │   ├── portfolio.ejs
│   │   ├── product.ejs
│   │   └── products.ejs
│   ├── partials/
│   │   ├── footer.ejs
│   │   └── header.ejs
│   └── error.ejs
├── public/
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Configuration

### Email Setup (Gmail)

For Gmail SMTP, you'll need to:
1. Enable 2-Step Verification on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the App Password in `SMTP_PASS` (not your regular password)

### MongoDB

The application uses MongoDB to store all data including:
- Products, Services, Projects
- Media files (images stored as buffers in MongoDB)
- Settings
- Form submissions (Inquiries)

## Usage

### Admin Panel

1. **Login** at `/admin/login`
2. **Upload Media**: Go to Media Library and upload images (automatically compressed and resized)
3. **Manage Services**: Add services with Bootstrap icons (browse at https://icons.getbootstrap.com/)
4. **Manage Projects**: Create portfolio projects and assign images
5. **Manage Products**: Add products with sizes and pricing
6. **Configure Settings**: Set company info, social links, theme, and hero image
7. **View Inquiries**: Check form submissions and mark as read/delete

### Public Site

- All forms automatically save to database and send email notifications
- Product pages allow multi-select of pool sizes
- Home page shows hero image (if set) or CTA buttons
- Footer displays social links when configured in settings

## Features in Detail

### Media Management
- Images are uploaded, compressed, and resized into three sizes:
  - **Large**: 1920x1920 max (for hero images)
  - **Medium**: 800x800 max (for product/project pages)
  - **Thumbnail**: 300x300 (for galleries)
- All images stored in MongoDB as buffers (not on disk)

### Forms
- All forms include validation
- Submissions saved to database
- Email sent to configured address (markagrover85@gmail.com)
- Product page forms include multi-select for pool sizes

### SEO
- SEO title and description fields for products and projects
- Default SEO settings in admin panel
- Meta tags in page headers

## Development

- Uses `nodemon` for development auto-reload
- Environment-based configuration
- Well-commented code for maintainability

## License

ISC

## Support

For issues or questions, please contact the development team.

