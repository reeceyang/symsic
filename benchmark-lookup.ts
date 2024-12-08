import { db } from "@/server/db";
import { kernScores, kernPatterns, kernPatternMatches} from "@/server/db/schema";
import dotenv from 'dotenv';
import { meiToRegex } from "@/common/meiToRegex";
import { desc, sql } from "drizzle-orm";
import { generatePatterns } from "pattern-generator";
import {checkAndReturnPattern, sequentialScan} from "@/server/api/routers/search";
dotenv.config();

async function benchmarkLookup() {
    // this function benchmarks the lookup of each pattern in the db
    const patterns = generatePatterns();
    const regex_patterns = patterns.map((pattern) => meiToRegex(pattern));
    const report_seq_scan = await sequentialPatternSearch(patterns);
    const report_inv_index = await invertedIndexPatternSearch(regex_patterns);
    const final_report = {
        sequential_scan: report_seq_scan,
        inverted_index: report_inv_index,
    }
    return final_report;
}

class MedianTracker {
    // class to keep track of the median of a stream of numbers
    // using two heaps
    // https://www.geeksforgeeks.org/median-of-stream-of-integers-running-integers/

    // this isn't actually a heap lol but it's fine
    private lowerHeap: number[];
    private higherHeap: number[];

    constructor() {
        this.lowerHeap = [];
        this.higherHeap = [];
    }

    addNum(num: number) {
        if (this.lowerHeap.length == 0 || num < this.lowerHeap[0]!) {
            this.lowerHeap.push(num);
            this.lowerHeap.sort((a, b) => b - a);
        } else {
            this.higherHeap.push(num);
            this.higherHeap.sort((a, b) => a - b);
        }

        if (this.lowerHeap.length > this.higherHeap.length + 1) {
            let num = this.lowerHeap.shift();
            this.higherHeap.push(num!);
            this.higherHeap.sort((a, b) => a - b);
        } else if (this.higherHeap.length > this.lowerHeap.length) {
            let num = this.higherHeap.shift();
            this.lowerHeap.push(num!);
            this.lowerHeap.sort((a, b) => b - a);
        }
    }

    getMedian() {
        if (this.lowerHeap.length == 0) {
            return 0;
        }
        if (this.lowerHeap.length == this.higherHeap.length) {
            return (this.lowerHeap[0]! + this.higherHeap[0]!) / 2;
        } else {
            return this.lowerHeap[0];
        }
    }
}


async function sequentialPatternSearch(patterns: string[]) {
    // patterns in regex format
    // this function searches for each pattern sequentially
    // measurements are all in milliseconds
    const measurements = {
        min_time: Number.MAX_SAFE_INTEGER,
        max_time: Number.MIN_SAFE_INTEGER,
        count: 0,
        sum_of_times: 0,
    }
    const medianTracker = new MedianTracker();

    for (let pattern of patterns) {
        console.log(`searching for pattern ${pattern}`);
        let start = Date.now();
        let _ = await sequentialScan(pattern, db);
        let end = Date.now();
        let time = end - start;
        measurements.min_time = Math.min(measurements.min_time, time);
        measurements.max_time = Math.max(measurements.max_time, time);
        measurements.sum_of_times += time;
        measurements.count += 1;
        medianTracker.addNum(time);
    }

    const report = {
        min_time: measurements.min_time,
        max_time: measurements.max_time,
        avg_time: measurements.sum_of_times / measurements.count,
        median_time: medianTracker.getMedian(),
    }
    return report;
}

async function invertedIndexPatternSearch(patterns: string[]) {
    // patterns in regex format
    // this function searches for each pattern using the inverted index
    // measurements are all in milliseconds
    const measurements = {
        min_time: Number.MAX_SAFE_INTEGER,
        max_time: Number.MIN_SAFE_INTEGER,
        count: 0,
        sum_of_times: 0,
    }
    const medianTracker = new MedianTracker();

    for (let pattern of patterns) {
        console.log(`inv index searching for pattern ${pattern}`);
        let start = Date.now();
        let _ = await checkAndReturnPattern(pattern, db);
        let end = Date.now();
        let time = end - start;
        measurements.min_time = Math.min(measurements.min_time, time);
        measurements.max_time = Math.max(measurements.max_time, time);
        measurements.sum_of_times += time;
        measurements.count += 1;
        medianTracker.addNum(time);
    }

    const report = {
        min_time: measurements.min_time,
        max_time: measurements.max_time,
        avg_time: measurements.sum_of_times / measurements.count,
        median_time: medianTracker.getMedian(),
    }
    return report;
}

// run the benchmark
let result = await benchmarkLookup();
console.log(result);
process.exit(0);