function diffFormatter(diffi) {
    if (isNaN(diffi)) return diffi;

    if(diffi.length < 5)
        return diffi;

    if(diffi.length < 7)
        return (diffi/10**3).toFixed(3);

    if(diffi.length < 10)
        return (diffi/10**6).toFixed(3);

    if(diffi.length < 13)
        return (diffi/10**9).toFixed(3);

    if(diffi.length < 16)
        return (diffi/10**12).toFixed(3);
}

module.exports = {diffFormatter};
