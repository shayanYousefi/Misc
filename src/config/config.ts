function getConfig(key: string, type?: string) {
    let config = process.env[key];
    if (config === undefined) {
        throw new Error(`No config ${key} found`);
    }
    switch (type) {
        case 'string':
            return config;
        case 'number':
            if (process.env[key] === undefined) {
                throw new Error(`No config ${key} found`);
            } else {
                return parseInt(config, 10);
            }

    }
}