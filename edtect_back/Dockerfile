# =========================================================
# 🐘 Base Image (Updated to PHP 8.4 for Laravel 11/Symfony 8)
# =========================================================
FROM php:8.4-fpm

# Set working directory
WORKDIR /app

# =========================================================
# 🧰 System dependencies
# =========================================================
RUN apt-get update && apt-get install -y \
    git \
    curl \
    gnupg \
    zip \
    unzip \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# =========================================================
# 🧩 PHP Extensions
# =========================================================
COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

RUN install-php-extensions sockets zip pdo_mysql mbstring exif pcntl bcmath gd intl

# =========================================================
# 🎼 Composer
# =========================================================
COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

# =========================================================
# 📦 Laravel App Setup
# =========================================================
COPY . .

# Run composer install
RUN composer install --no-interaction --prefer-dist --optimize-autoloader

# =========================================================
# 🚀 Expose & Run
# =========================================================
EXPOSE 9000
CMD ["php-fpm"]
