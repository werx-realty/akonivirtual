import { config, send } from '../_lib/util.js';
export default function handler(req, res) { send(res, 200, config()); }
