# Blog Automation Scripts

This repo contains scripts that let you write blog posts locally in plain `.txt` files, then automatically parse those files and upload them as published posts to [Bear Blog](https://bearblog.dev). It enables a fast, local-first blogging workflow with minimal manual steps. Useful for brief "journal" style entries, and enables a seamless workflow. Save your local file >>> your blog gets updated. No more work on your end

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Edit `updateBearBlog.js` and replace the placeholder credentials with your own Bear Blog username and password:
   ```js
   const BEAR_USERNAME = 'your_username_here';
   const BEAR_PASSWORD = 'your_password_here';
   ```

## ⚠️ Security Warning

Your Bear Blog credentials are stored in plain text. For production use, switch to environment variables or a secure secret manager.
