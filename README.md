# HABA
`version = 0.1.0`

# FOR DEVELOPING

    $ INSTALL MODULES --> yarn or npm install;

    $ MIGRATE --> yarn/(npm run) migrate-dev
                  --> for creating database tables;

    $ START --> {
        yarn/(npm run) dev --> with nodemon, for restarting every time
                     when updating;
        yarn/(npm run) start --> default start;
    };

    $ DATABASE --> haba.sql;

# FOR PRODUCTION

    $ INSTALL MODULES --> yarn or npm install; 

    $ MIGRATE --> yarn/(npm run) migrate 
                  --> for creating database tables with .env.production;

    $ START --> {
        yarn/(npm run) start --> with .env.production;
    };
