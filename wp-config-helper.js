const fs = require('fs-extra');

async function getConfig(website_name, db_name, db_user, db_pwd, prefix) {
    if (!prefix) {
        prefix = '_wp';
    }
    let salt_data = '';

    try {
        salt_data = await fs.readFile(`./${website_name}/salt`, {
            encoding: 'utf-8'
        });
        salt_data = `\n${salt_data}`;
        let config = `
        <?php
            define('DB_NAME', '${db_name}');
            define('DB_USER', '${db_user}');
            define('DB_PASSWORD', '${db_pwd}');
            define('DB_HOST', 'localhost');
            define('DB_CHARSET', 'utf8');
            define('DB_COLLATE', '');
            $table_prefix  = '${prefix}';
            define('WP_DEBUG', false);
            if ( !defined('ABSPATH') )
                define('ABSPATH', dirname(__FILE__) . '/');
            
            require_once(ABSPATH . 'wp-settings.php');
            ${salt_data}
        `;

        return config;
    } catch (E) {
        throw E;
    }
}


function getHtaccess() {
    return `# BEGIN WordPress
    <IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.php$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.php [L]
    </IfModule>
    # END WordPress`;
}


function getApacheConfig(website_domain, admin_email, path) {
    let config = `<VirtualHost *:80>
    ServerName ${website_domain}
    ServerAdmin ${admin_email}
    DocumentRoot ${path}
</VirtualHost>`;
    return config;
}

module.exports = {
    getConfig: getConfig,
    getHtaccess: getHtaccess,
    getApacheConfig: getApacheConfig
}