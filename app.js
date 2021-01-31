const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());

function existPilot(id, res, rej) {
    db.all('SELECT id FROM pilots WHERE id = ?', [id], (err, rows) => {
        if (rows && rows.length > 0) {
            res();
        } else {
            rej();
        }
    });
}

function existPlan(number, res, rej) {
    db.all('SELECT number FROM plans WHERE number = ?', [number], (err, rows) => {
        if (rows && rows.length > 0) {
            res();
        } else {
            rej();
        }
    });
}

function existPlanFields(dep, arr, date, timeD, timeA, res, rej) {
    db.all('SELECT destination, arrival, date, dest, arr FROM plans WHERE (destination=? AND arrival=? AND date=? AND dest=? AND arr=?) OR destination=arrival', [dep, arr, date, timeD, timeA], (err, rows) => {
        if (rows && rows.length > 0) {
            res();
        } else {
            rej();
        }
    });
}

function existRequests(numbers, res) {
    if (numbers[3]) {
        db.all('SELECT id, number FROM connector WHERE id = ? AND number = ?', [numbers[0].id, numbers[3].id], (err, rows) => {
            if (rows && rows.length > 0) {
                delete numbers[3];
            }
            db.all('SELECT id, number FROM connector WHERE id = ? AND number = ?', [numbers[0].id, numbers[2].id], (err, rows) => {
                if (rows && rows.length > 0) {
                    if (numbers[3]){
                        numbers[2] = numbers[3];
                        delete numbers[3]
                    }else{
                        delete numbers[2];
                    }
                }
                db.all('SELECT id, number FROM connector WHERE id = ? AND number = ?', [numbers[0].id, numbers[1].id], (err, rows) => {
                    if (rows && rows.length > 0) {
                        if((numbers[3] && numbers[2]) || numbers[3]){
                            numbers[1] = numbers[3];
                            delete numbers[3];
                        }else if(numbers[2]){
                            numbers[1] = numbers[2];
                            delete numbers[2];
                        }else {
                            delete numbers[1];
                        }
                    }
                    res(numbers);
                });
            });
        });

    } else if (numbers[2]) {
        db.all('SELECT id, number FROM connector WHERE id = ? AND number = ?', [numbers[0].id, numbers[2].id], (err, rows) => {
            if (rows && rows.length > 0) {
                delete numbers[2];
            }
            db.all('SELECT id, number FROM connector WHERE id = ? AND number = ?', [numbers[0].id, numbers[1].id], (err, rows) => {
                if (rows && rows.length > 0) {
                    if(numbers[2]){
                        numbers[1] = numbers[2];
                        delete numbers[2];
                    }else{
                        delete numbers[1];
                    }
                }
                res(numbers);
            });
        });
    } else if (numbers[1]) {
        db.all('SELECT id, number FROM connector WHERE id = ? AND number = ?', [numbers[0].id, numbers[1].id], (err, rows) => {
            if (rows && rows.length > 0) {
                delete numbers[1];
            }
            res(numbers);
        });
    } else {
        res(numbers);
    }
}

function findActualPlans(data, res){
    let actual = [];
    let j = 0;
    for(let i = 0; i<data.length; i++){
        db.all('SELECT id, number FROM connector WHERE number = ?', [data[i].number], (err, rows) => {
            if(rows.length < 2){
                actual[j] = data[i];
                j++;
            }
            if(i === data.length - 1){
                res(actual);
            }
        });
    }
}

let db = new sqlite3.Database('airport.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
});

db.serialize(function () {
    db.run('CREATE TABLE IF NOT EXISTS pilots (id NUMERICAL, name TEXT, date DATE)');
    db.run('CREATE TABLE IF NOT EXISTS plans (number INT, destination TEXT, arrival TEXT, date DATE, dest TIME, arr TIME)');
    db.run('CREATE TABLE IF NOT EXISTS connector (id INT, number INT)');
});

app.get('/api/pilots', (req, res) => {
    db.all('SELECT id, name, date FROM pilots', [], (err, rows) => {
        res.status(200).json(rows);
    });
});

app.post('/api/pilots', (req, res) => {
    const pilot = {...req.body};
    existPilot(pilot.id, () => {
        db.run('DELETE FROM pilots WHERE id = ?', pilot.id);
        db.run('INSERT INTO pilots VALUES (?,?,?)', [pilot.id, pilot.name, pilot.date], () => {
            res.status(201).json(null);
        });
    }, () => {
        db.run('INSERT INTO pilots VALUES (?,?,?)', [pilot.id, pilot.name, pilot.date], () => {
            res.status(201).json(pilot);
        });
    });
});

app.get('/api/plans', (req, res) => {
    db.all('SELECT number, destination, arrival, date, dest, arr FROM plans', [], (err, rows) => {
        res.status(200).json(rows);
    });
});

app.post('/api/plans', (req, res) => {
    const plan = {...req.body};
    existPlan(plan.number, () => {
        res.status(202).json(null);
    }, () => {
        existPlanFields(plan.destination, plan.arrival, plan.date, plan.dest, plan.arr, () => {
            res.status(202).json(null);
        }, () => {
            db.run('INSERT INTO plans VALUES (?,?,?,?,?,?)', [plan.number, plan.destination, plan.arrival, plan.date, plan.dest, plan.arr], () => {
                res.status(201).json(plan);
            });
        });
    });
});

function checkDateP(date) {
    return date.match(/[.](02)[.](2021)$/);
}

app.post('/api/actual', (req, res) => {
    const id = {...req.body};
    db.all('SELECT number, destination, arrival, date, dest, arr FROM plans', [], (err, rows) => {
        for (let i = 0; i < rows.length; i++) {
            if (!checkDateP(rows[i].date)) {
                rows.splice(i, 1);
                i = 0;
            }
        }
        //Начало изменений
        findActualPlans(rows, (actual) => {
            if(actual && actual.length > 0){
                res.status(201).json(actual);
            }else{
                res.status(201).json(null);
            }
        });
        //конец изменений
        //res.status(201).json(rows);
    });

});

app.post('/api/writeActual', (req, res) => {
    const id = {...req.body};
    db.all('SELECT id, number FROM connector WHERE id = ?', [id.id], (err, rows) => {
        if(rows && rows.length === 3){
            db.all('SELECT number, destination, arrival, date, dest, arr FROM plans WHERE number = ? OR number = ? OR number = ?', [rows[0].number, rows[1].number, rows[2].number], (err, rows) => {
                res.status(200).json(rows);
            });
        }else if(rows && rows.length === 2){
            db.all('SELECT number, destination, arrival, date, dest, arr FROM plans WHERE number = ? OR number = ?', [rows[0].number, rows[1].number], (err, rows) => {
                res.status(200).json(rows);
            });
        }else if(rows && rows.length === 1){
            db.all('SELECT number, destination, arrival, date, dest, arr FROM plans WHERE number = ?', [rows[0].number], (err, rows) => {
                res.status(200).json(rows);
            });
        }else{
            res.status(200).json(null);
        }
    });
});

app.post('/api/delete', (req, res) => {
    const data = {...req.body};
    db.run('DELETE FROM connector WHERE id = ? AND number = ?', [data.id, data.number]);
    res.status(202).json();
});

app.post('/api/size', (req, res) => {
    const data = {...req.body};
    db.all('SELECT id, number FROM connector WHERE id = ?', [data.id], (err, rows) => {
        if(rows){
            res.status(201).json(rows.length);
        }else{
            res.status(201).json(0);
        }
    });
});

app.post('/api/request', (req, res) => {
    const numbers = {...req.body};
    existRequests(numbers, (nonExist) => {
        if (nonExist[3]) {
            db.all('SELECT number, destination, arrival, date, dest, arr FROM plans WHERE number = ? OR number = ? OR number = ?', [nonExist[1].id, nonExist[2].id, nonExist[3].id], (err, rows) => {
                db.run('INSERT INTO connector VALUES (?,?)', [nonExist[0].id, nonExist[1].id]);
                db.run('INSERT INTO connector VALUES (?,?)', [nonExist[0].id, nonExist[2].id]);
                db.run('INSERT INTO connector VALUES (?,?)', [nonExist[0].id, nonExist[3].id]);
                res.status(201).json(rows);
            });
        } else if (nonExist[2]) {
            db.all('SELECT number, destination, arrival, date, dest, arr FROM plans WHERE number = ? OR number = ?', [nonExist[1].id, nonExist[2].id], (err, rows) => {
                db.run('INSERT INTO connector VALUES (?,?)', [nonExist[0].id, nonExist[1].id]);
                db.run('INSERT INTO connector VALUES (?,?)', [nonExist[0].id, nonExist[2].id]);
                res.status(201).json(rows);
            });
        } else if (nonExist[1]) {
            db.all('SELECT number, destination, arrival, date, dest, arr FROM plans WHERE number = ?', [nonExist[1].id], (err, rows) => {
                db.run('INSERT INTO connector VALUES (?,?)', [nonExist[0].id, nonExist[1].id]);
                res.status(201).json(rows);
            });
        }else{
            res.status(201).json(null);
        }
    });
});

app.use(express.static(path.resolve(__dirname, 'client')));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
});

app.listen(3000, () => console.log('Server has been started on port 3000...'));

// db.close((err) => {
//     if (err) {
//         return console.error(err.message);
//     }
//     console.log('Close the database connection.');
// });