#!/bin/bash

# SSL Setup Script for adityagokula.com
# Run this on your AWS EC2 server (Amazon Linux 2023)

echo "🔒 Setting up SSL for adityagokula.com..."

# Step 1: Install Certbot (Let's Encrypt client)
echo "📦 Installing Certbot..."
sudo dnf update -y
sudo dnf install -y python3-pip
sudo pip3 install certbot certbot-nginx

# Step 2: Verify nginx is running
echo "🔍 Checking nginx status..."
sudo systemctl status nginx

# Step 3: Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

# Step 4: Obtain SSL certificate
echo "🔑 Obtaining SSL certificate from Let's Encrypt..."
sudo certbot --nginx -d adityagokula.com -d www.adityagokula.com

# Step 5: Test automatic renewal
echo "🔄 Testing automatic renewal..."
sudo certbot renew --dry-run

# Step 6: Set up automatic renewal cron job
echo "⏰ Setting up automatic renewal..."
echo "0 12 * * * /usr/local/bin/certbot renew --quiet" | sudo crontab -

# Step 7: Restart nginx
echo "🔄 Restarting nginx..."
sudo systemctl restart nginx

# Step 8: Test SSL
echo "✅ Testing SSL setup..."
curl -I https://adityagokula.com

echo "🎉 SSL setup complete!"
echo "🌐 Your site should now be available at: https://adityagokula.com"
echo "🔧 Your API should now be available at: https://adityagokula.com/cometchat-integrations/"