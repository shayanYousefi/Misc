import {createLogger, transports, format, Logger} from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import {bgCyan} from "chalk";

let logger: Logger;

const LEVEL_COLORS = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "blue",
    verbose: "cyan",
    debug: "white"
}

function initLogger() {

    if (isProductionEnvironment()) {
        logger = createLogger({
            exitOnError: false,
            level: process.env.LOGGER_LEVEL,
            format: format.errors({stack: true}),
            transports: [
                consoleTransport(),
                errorFileTransport(),
                fileTransport(),
            ]
        })
    } else if (isDevelopmentEnvironment()) {
        logger = createLogger({
            exitOnError: false,
            level: 'debug',
            format: format.errors({stack: true}),
            transports: [
                consoleTransport(),
                fileTransport(),
            ]
        })
    }
}

function errorFileTransport() {
    return new DailyRotateFile({
        level: 'error',
        dirname: `logs/errors`,
        filename: '%DATE%',
        extension: '.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: process.env.LOGGER_ZIP_ARCHIVE,
        maxSize: config.log?.maxSize,
        maxFiles: config.log?.maxFiles,
        format: format.combine(
            format.errors({stack: true}),
            format.metadata(),
            removePipelineIdMetadata(),
            format.timestamp(),
            format.json(),
        )
    })
}

function fileTransport() {
    return new DailyRotateFile({
        level: config.log.level,
        dirname: `logs`,
        filename: '%DATE%',
        extension: '.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: config.log?.zippedArchive,
        maxSize: config.log?.maxSize,
        maxFiles: config.log?.maxFiles,
        format: format.combine(
            format.errors({stack: true}),
            format.metadata(),
            removePipelineIdMetadata(),
            format.timestamp(),
            format.json(),
        )
    })
}

function isProductionEnvironment() {
    return process.env.NODE_ENV === 'production'
}

function isDevelopmentEnvironment() {
    return process.env.NODE_ENV === 'development'
}

function consoleTransport() {
    if (isProductionEnvironment()) {
        return new transports.Console({
            level: 'http',
            format: format.combine(
                format.colorize({level: true, colors: LEVEL_COLORS}),
                format.metadata(),
                removePipelineIdMetadata(),
                format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS Z'}),
                printf,
            ),
        })
    } else if (isDevelopmentEnvironment()) {
        return new transports.Console({
            level: config.log.level,
            format: format.combine(
                format.colorize({level: true, colors: LEVEL_COLORS}),
                format.metadata(),
                removePipelineIdMetadata(),
                format.timestamp({format: 'YYYY-MM-DD HH:mm:ss.SSS Z'}),
                printf,
            )
        })
    } else {
        throw new Error(`Unknown environment`)
    }
}

function getLogger() {
    if (!logger) {
        initLogger();
    }
    return logger
}

const removePipelineIdMetadata = format((info) => {
    if (info.metadata.pipelineId) {
        info.pipelineId = info.metadata.pipelineId;
        delete info.metadata.pipelineId;
    }
    return info
})

const printf = format.printf((info) => {
    let meta = stringifyMetadata(info.metadata);
    let pipelineId = stringifyPipelineId(info.pipelineId);
    return handleErrorsOrMessage(info, pipelineId, meta);
});

function handleErrorsOrMessage(info: { level: string, message: string, metadata?: any, }, pipelineId: string, meta: string) {
    return info.metadata?.stack
        ? `${info.level}${pipelineId}: ${info.metadata.stack}`
        : `${info.level}${pipelineId}: ${info.message} ${meta}`
}

function stringifyMetadata(metadata: object) {
    return isEmpty(metadata) ? '' : `${JSON.stringify(metadata, null, '  ')}`
}

function stringifyPipelineId(id: string) {
    return id ? ` [${bgCyan(id.slice(-12, 36))}]` : ''
}

function isEmpty(obj: object) {
    return Object.keys(obj).length === 0
}


export {
    getLogger,
}