import {v4 as uuidV4} from 'uuid';
import {Logger} from "winston";


export default class RequestLogger {
    #pipelineId: string;
    #logger: Logger;

    constructor(logger: Logger, pipelineId?: string) {

        if (pipelineId) {
            this.#pipelineId = pipelineId;
        } else {
            this.#pipelineId = uuidV4();
        }
        this.#logger = logger;
    }

    getPipelineId() {
        return this.#pipelineId
    }

    error(msg: any, meta?: object) {
        this.#logger.error(msg, {
            ...meta,
            pipelineId: this.#pipelineId
        });
    }

    warn(msg: any, meta?: object) {
        this.#logger.warn(msg, {
            ...meta,
            pipelineId: this.#pipelineId
        });
    }

    info(msg: any, meta?: object) {
        this.#logger.info(msg, {
            ...meta,
            pipelineId: this.#pipelineId
        });
    }

    http(msg: any, meta?: object) {
        this.#logger.http(msg, {
            ...meta,
            pipelineId: this.#pipelineId
        });
    }

    verbose(msg: any, meta?: object) {
        this.#logger.verbose(msg, {
            ...meta,
            pipelineId: this.#pipelineId
        });
    }

    debug(msg: any, meta?: object) {
        this.#logger.debug(msg, {
            ...meta,
            pipelineId: this.#pipelineId
        });
    }

    silly(msg: any, meta?: object) {
        this.#logger.silly(msg, {
            ...meta,
            pipelineId: this.#pipelineId
        });
    }

}