const gulp = require('gulp');
const remoteSrc = require('gulp-remote-src');
const unzip = require('gulp-unzip');
const file = require('gulp-file');
const mysql = require('mysql2/promise');
const runSequence = require('run-sequence');
// runSequence.options.ignoreUndefinedTasks = true;



const configHelper = require('./wp-config-helper');


const website_name = 'websitename2';
const db_name = 'websitename2';
const db_user = 'websitename';
const db_pwd = 'websitename';
const db_prefix = 'wp_';

const db_config = {
    host: "127.0.0.1",
    user: "root",
    password: "root",
    port: 8889
};



const website_domain = 'www.google.com';
const admin_email = 'muditjuneja@outlook.com';
const path = `/var/www/html/${website_name}`;







gulp.task('install:wp', function (callback) {
    runSequence('download-worpress', 'unzip-wordpress', 'get-salt', 'setup-db', 'configure-wordpress', 'make-htaccess', callback);
});


// gulp.task('setup', ['download-worpress', 'unzip-wordpress', 'get-salt', 'setup-db', 'configure-wordpress', 'make-htaccess'], () => {
//     // console.log('Running');
// });


gulp.task('download-worpress', () => {
    console.log('downloading...');
    remoteSrc(['latest.zip'], {
        base: 'https://wordpress.org/'
    }).pipe(gulp.dest('./wp/'));
})



gulp.task('unzip-wordpress', () => {
    console.log('unzipping latest version...');
    gulp.src('wp/latest.zip')
        .pipe(unzip())
        .pipe(gulp.dest(`${website_name}/`))
});


gulp.task('get-salt', () => {
    console.log('getting salt...');
    remoteSrc(['salt'], {
            base: 'https://api.wordpress.org/secret-key/1.1/'
        })
        .pipe(gulp.dest(`${website_name}/`))
})

gulp.task('setup-db', async (cb) => {
    console.log('setting databases');

    let connection;
    try {
        connection = await mysql.createConnection(db_config);
        // _transaction = await connection.beginTransaction();

        // await conn.query('START TRANSACTION')

        // console.log(_transaction);
        let create_db_q = `CREATE DATABASE IF NOT EXISTS ${db_name};`;
        await connection.execute(create_db_q);

        let user_create_q = `GRANT ALL ON ${db_name}.* TO '${db_user}'@'localhost' IDENTIFIED BY '${db_pwd}';`;
        await connection.execute(user_create_q);



        let flush_q = 'FLUSH PRIVILEGES;';
        await connection.execute(flush_q);

    } catch (E) {
        console.log(E);
        let drop_db_q = `DROP DATABASE IF EXISTS ${db_name};`;
        await connection.execute(drop_db_q);
        // cb(E)
    }

})



gulp.task('configure-wordpress', async (cb) => {

    try {
        let config = await configHelper.getConfig(website_name, db_name, db_user, db_pwd, db_prefix);
        return file('wp-config.php', config, {
                src: true
            })
            .pipe(gulp.dest(`./${website_name}/wordpress/`));
    } catch (E) {
        // cb(E);
    }
});


gulp.task('make-htaccess', (cb) => {
    let _htaccess = configHelper.getHtaccess();
    return file('.htaccess', _htaccess, {
            src: true
        })
        .pipe(gulp.dest(`./${website_name}/wordpress/`));
});


gulp.task('make-apache-config', (cb) => {
    let config = configHelper.getApacheConfig(website_domain, admin_email, path);
    // console.log(config);
    return file(`${website_name}.conf`, config, {
            src: true
        })
        .pipe(gulp.dest(`/etc/`));
});