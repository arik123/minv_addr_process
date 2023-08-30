import fs from 'fs';
import geojsontoosm from 'geojsontoosm';

const file = fs.readFileSync('adresy.csv').toString();

let lines = file.replaceAll(/"(\d+),(\d+)"/g, '$1.$2').split('\r\n');

const bbox = [[18.62, 18.66],[49.16, 49.18]]

const head = [
    '_id', //deleted
    'ref:minvskaddress',//'IDENTIFIKATOR',
    'KRAJ', //deleted
    'OKRES', //deleted
    'addr:city',//'OBEC',
    'addr:suburb',//'CAST_OBCE',
    'addr:street',//'ULICA',
    'addr:conscriptionnumber',//'SUPISNE_CISLO',
    'addr:streetnumber', //'ORIENTACNE_CISLO_CELE',
    'addr:postcode',//'PSC',
    'ADRBOD_X',
    'ADRBOD_Y',
    'CHANGEDAT', //deleted
    'municipalityCode' //deleted
]//lines.splice(0,1)[0].split(',');

lines = lines.map(line => {
    let ret = {};
    line.split(',').forEach((e, i) => {
        ret[head[i]]=e;
    });
    const x = parseFloat(ret.ADRBOD_X);
    delete ret.ADRBOD_X;
    const y = parseFloat(ret.ADRBOD_Y);
    delete ret.ADRBOD_Y;

    delete ret._id;
    delete ret.KRAJ;
    delete ret.OKRES;
    delete ret.CHANGEDAT;
    delete ret.municipalityCode;
    if(ret["addr:streetnumber"]) {
        ret['addr:housenumber'] = ret["addr:conscriptionnumber"] + "/" + ret["addr:streetnumber"];
    } else {
        ret['addr:housenumber'] = ret["addr:conscriptionnumber"];
        ret['addr:place'] = ret["addr:suburb"];
        delete ret['addr:suburb'];
    }
    ret['addr:country'] = 'SK';
    ret['source:addr'] = 'minvskaddress';
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [x, y]
        },
        properties: ret
    };
});
lines = lines.filter((e)=>{
    return  e.geometry.coordinates[0] > bbox[0][0] &&
            e.geometry.coordinates[0] < bbox[0][1] &&
            e.geometry.coordinates[1] > bbox[1][0] &&
            e.geometry.coordinates[1] < bbox[1][1]
})
fs.writeFileSync('out.geojson','');

/* GEOJSON OUTPUT
var stream = fs.createWriteStream("out.geojson", {flags:'a', encoding: 'utf-8'});

function waitDrain(stream) {
    return new Promise(res => {
        stream.once('drain', res);
    });
}

stream.write(`{"type":"FeatureCollection","features":[`);
for( let i = 0; i  < lines.length; i++) {
    const el = JSON.stringify(lines[i]);
    const ok = stream.write((i==0 ? '' : ',') + el);
    if(!ok) {
        await waitDrain(stream);
    }
}
stream.write(']}');
stream.end();
*/
fs.writeFileSync('out.osm', geojsontoosm({
    type:'FeatureCollection',
    features: lines
}), {encoding: 'utf-8'});