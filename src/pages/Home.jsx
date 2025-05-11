import React, { useState, useEffect, useMemo } from 'react';
import '../style.css';

// Convert time string "MM:SS.ss" to seconds
const timeToSeconds = (timeStr) => {
    if (!timeStr) return Infinity;
    const [min, sec] = timeStr.split(':').map(parseFloat);
    return sec == null ? min : min * 60 + sec;
};
// Extract numeric distance from event key
const distanceFromEvent = (event) => parseFloat(event.replace(/[^0-9.]/g, ''));

export default function Home() {
    // Filter & table state
    const [data, setData] = useState({});
    const [eventOrder, setEventOrder] = useState([]);
    const [sortKey, setSortKey] = useState('name');
    const [sortDir, setSortDir] = useState('asc');

    // Dynamic API filters
    const [gender, setGender] = useState('m');      // 'm' or 'f'
    const [year, setYear] = useState(2025);          // numeric
    const [season, setSeason] = useState('outdoor'); // e.g. 'outdoor', 'indoor'

    // Relay selectors state
    const [legs, setLegs] = useState(['', '', '', '']);
    const [relays, setRelays] = useState([]);

    // Fetch athletes on filter change
    useEffect(() => {
        fetch(`https://api.fairport.run/athletes/${year}/${season}/${gender}`)
            .then((r) => r.json())
            .then((json) => {
                const filtered = Object.fromEntries(
                    Object.entries(json).filter(([_, ath]) => !ath.name.toLowerCase().includes('relay'))
                );
                setData(filtered);
                const events = new Set();
                Object.values(filtered).forEach((ath) =>
                    Object.keys(ath.performances)
                        .filter(e => !e.toLowerCase().includes('relay') && !e.includes('x'))
                        .forEach(e => events.add(e))
                );
                setEventOrder(Array.from(events).sort((a, b) => distanceFromEvent(a) - distanceFromEvent(b)));
            });
        // clear relays when filters change
        setRelays([]);
    }, [gender, year, season]);

    // Flattened rows + sorting logic
    const rows = useMemo(
        () => Object.entries(data).map(([id, ath]) => ({ id, ...ath })), [data]
    );

    const sortedRows = useMemo(() => {
        return [...rows].sort((a, b) => {
            let aVal, bVal;
            if (sortKey === 'name') {
                aVal = a.name; bVal = b.name;
            } else if (sortKey === 'grade') {
                aVal = a.grade; bVal = b.grade;
            } else {
                const pa = a.performances[sortKey]?.performance;
                const pb = b.performances[sortKey]?.performance;
                aVal = timeToSeconds(pa); bVal = timeToSeconds(pb);
            }
            const aInf = aVal === Infinity;
            const bInf = bVal === Infinity;
            if (aInf || bInf) return aInf ? 1 : -1;
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [rows, sortKey, sortDir]);

    const requestSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    // Handlers for dynamic filters
    const toggleGender = () => setGender(g => (g === 'm' ? 'f' : 'm'));
    const handleYearChange = (e) => setYear(Number(e.target.value) || year);
    const handleSeasonChange = (e) => setSeason(e.target.value);

    // Relay fetch
    const handleLegChange = (i, v) => {
        const arr = [...legs]; arr[i] = v; setLegs(arr);
    };
    const fetchRelays = () => {
        if (legs.some(l => !l)) return;
        fetch('https://api.fairport.run/relays', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year, season, gender, legs })
        })
            .then(r => r.json())
            .then(list => setRelays(list));
    };

    // function to fetch athletes\ n
const fetchAthletes = () => {
    fetch(`https://api.fairport.run/athletes/${year}/${season}/${gender}`)
        .then(r => r.json())
        .then(json => {
            const filtered = Object.fromEntries(
                Object.entries(json).filter(([_, ath]) => !ath.name.toLowerCase().includes('relay'))
            );
            setData(filtered);
            const events = new Set();
            Object.values(filtered).forEach((ath) =>
                Object.keys(ath.performances)
                    .filter(e => !e.toLowerCase().includes('relay') && !e.includes('x'))
                    .forEach(e => events.add(e))
            );
            setEventOrder(Array.from(events).sort((a, b) => distanceFromEvent(a) - distanceFromEvent(b)));
        });
    setRelays([]);
};

useEffect(fetchAthletes, [gender, year, season]);

return (
    <div className="container">

        <h1 className="title">Fairport Runners ({gender === 'm' ? 'Boys' : 'Girls'})</h1>
        <p className="instructions">Click headers to sort.</p>
        <p className="instructions">Bold implies FAT & underline implies conversion</p>
        <div className="controls">
            <button className="button" onClick={toggleGender}>
                Show {gender === 'm' ? 'Girls' : 'Boys'}
            </button>
            <input
                type="number" value={year} min={2000} max={new Date().getFullYear()}
                onChange={handleYearChange} className="select"
            />
            <select value={season} onChange={handleSeasonChange} className="select">
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
            </select>
        </div>

        {/* Athlete performances table */}
        <div className="table-wrapper">
            <table className="table">
                <thead>
                <tr>
                    <th className="th" onClick={() => requestSort('name')}>Name</th>
                    <th className="th" onClick={() => requestSort('grade')}>Grade</th>
                    {eventOrder.map(e => (
                        <th key={e} className="th" onClick={() => requestSort(e)}>{e}</th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {sortedRows.map(ath => (
                    <tr key={ath.id} className="row">
                        <td className="td">{ath.name}</td>
                        <td className="td">{ath.grade}</td>
                        {eventOrder.map(event => {
                            const p = ath.performances[event];
                            const t = p?.performance ?? '—';
                            const cls = `${p?.fat ? 'bold' : ''} ${p?.converted ? 'underline' : ''}`;
                            return <td key={event} className={`td ${cls}`}>{t}</td>;
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>

        {/* Relay selector & results */}
        <div className="selects">
            {legs.map((l, i) => (
                <select key={i} className="select" value={l} onChange={e => handleLegChange(i, e.target.value)}>
                    <option value="">Select event</option>
                    {eventOrder.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
            ))}
        </div>
        <button className="button" id="showRelay" onClick={fetchRelays}>Show Top 10 Relays</button>

        {relays.length > 0 && (
            <div className="table-wrapper">
                <table className="table">
                    <thead>
                    <tr>
                        <th className="th">Rank</th>
                        <th className="th">Total Time</th>
                        {legs.map((_, i) => <th key={i} className="th">Leg {i+1}</th>)}
                    </tr>
                    </thead>
                    <tbody>
                    {relays.map((r, idx) => (
                        <tr key={idx} className="row">
                            <td className="td">{idx+1}</td>
                            <td className="td bold">{r.time}</td>
                            {r.legs.map((leg, i) => {
                                const ath = data[leg.athlete_id];
                                const perf = ath?.performances[leg.event];
                                const name = ath?.name || leg.athlete_id;
                                const txt = perf?.performance ?? leg.time.toFixed(2);
                                const c = `${perf?.fat ? 'bold' : ''} ${perf?.converted ? 'underline' : ''}`;
                                return <td key={i} className={`td ${c}`}>{name} — {txt}</td>;
                            })}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);
}
