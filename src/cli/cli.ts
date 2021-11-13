import {disconnect as disconnectDB, init as initDB} from '../database/client.js';
import yargs from 'yargs';
import app from '../app.js';

yargs(process.argv.slice(2))
    .command('server', 'start a webserver', {
        p: {
            alias: 'port',
            type: 'number',
            default: process.env.SERVER_PORT,
            describe: 'the port webserver should listen to',
        },

    }, argv => {
        let server = app.listen(argv.p, () => {
            let add = server.address();
            if (!add) {
                console.error(`no add found exiting server`);
                process.exit(1);
            }
            if (typeof add === 'string') {
                console.log(`listening on port ${add}`);
            }else{
                console.log(`listening on address ${add.address} port ${add.port}`);
            }
            console.log(`connecting to database... please wait`)
            initDB()
                .then(() => {
                    console.log('connected to database');
                })
                .catch((e: Error) => {
                    console.log('could not connect to database');
                    console.log(e.message);
                    process.exit(1);
                })
                .finally(disconnectDB);
        });

    })
    .parse()

