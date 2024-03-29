var QRCode;
(function () {
    function l(a) {
        this.mode = t.MODE_8BIT_BYTE;
        this.data = a;
        this.parsedData = [];
        a = 0;
        for (var d = this.data.length; a < d; a++) {
            var b = [], c = this.data.charCodeAt(a);
            65536 < c ? (b[0] = 240 | (c & 1835008) >>> 18, b[1] = 128 | (c & 258048) >>> 12, b[2] = 128 | (c & 4032) >>> 6, b[3] = 128 | c & 63) : 2048 < c ? (b[0] = 224 | (c & 61440) >>> 12, b[1] = 128 | (c & 4032) >>> 6, b[2] = 128 | c & 63) : 128 < c ? (b[0] = 192 | (c & 1984) >>> 6, b[1] = 128 | c & 63) : b[0] = c;
            this.parsedData.push(b)
        }
        this.parsedData = Array.prototype.concat.apply([], this.parsedData);
        this.parsedData.length != this.data.length && (this.parsedData.unshift(191),
            this.parsedData.unshift(187), this.parsedData.unshift(239))
    }

    function f(a, d) {
        this.typeNumber = a;
        this.errorCorrectLevel = d;
        this.modules = null;
        this.moduleCount = 0;
        this.dataCache = null;
        this.dataList = []
    }

    function k(a, d) {
        if (void 0 == a.length)throw Error(a.length + "/" + d);
        for (var b = 0; b < a.length && 0 == a[b];)b++;
        this.num = Array(a.length - b + d);
        for (var c = 0; c < a.length - b; c++)this.num[c] = a[c + b]
    }

    function v(a, d) {
        this.totalCount = a;
        this.dataCount = d
    }

    function y() {
        this.buffer = [];
        this.length = 0
    }

    function z() {
        var a = !1, d = navigator.userAgent;
        /android/i.test(d) && (a = !0, (aMat = d.toString().match(/android ([0-9]\.[0-9])/i)) && aMat[1] && (a = parseFloat(aMat[1])));
        return a
    }

    l.prototype = {
        getLength: function (a) {
            return this.parsedData.length
        }, write: function (a) {
            for (var d = 0, b = this.parsedData.length; d < b; d++)a.put(this.parsedData[d], 8)
        }
    };
    f.prototype = {
        addData: function (a) {
            a = new l(a);
            this.dataList.push(a);
            this.dataCache = null
        }, isDark: function (a, d) {
            if (0 > a || this.moduleCount <= a || 0 > d || this.moduleCount <= d)throw Error(a + "," + d);
            return this.modules[a][d]
        }, getModuleCount: function () {
            return this.moduleCount
        },
        make: function () {
            this.makeImpl(!1, this.getBestMaskPattern())
        }, makeImpl: function (a, d) {
            this.moduleCount = 4 * this.typeNumber + 17;
            this.modules = Array(this.moduleCount);
            for (var b = 0; b < this.moduleCount; b++) {
                this.modules[b] = Array(this.moduleCount);
                for (var c = 0; c < this.moduleCount; c++)this.modules[b][c] = null
            }
            this.setupPositionProbePattern(0, 0);
            this.setupPositionProbePattern(this.moduleCount - 7, 0);
            this.setupPositionProbePattern(0, this.moduleCount - 7);
            this.setupPositionAdjustPattern();
            this.setupTimingPattern();
            this.setupTypeInfo(a,
                d);
            7 <= this.typeNumber && this.setupTypeNumber(a);
            null == this.dataCache && (this.dataCache = f.createData(this.typeNumber, this.errorCorrectLevel, this.dataList));
            this.mapData(this.dataCache, d)
        }, setupPositionProbePattern: function (a, d) {
            for (var b = -1; 7 >= b; b++)if (!(-1 >= a + b || this.moduleCount <= a + b))for (var c = -1; 7 >= c; c++)-1 >= d + c || this.moduleCount <= d + c || (0 <= b && 6 >= b && (0 == c || 6 == c) || 0 <= c && 6 >= c && (0 == b || 6 == b) || 2 <= b && 4 >= b && 2 <= c && 4 >= c ? this.modules[a + b][d + c] = !0 : this.modules[a + b][d + c] = !1)
        }, getBestMaskPattern: function () {
            for (var a =
                0, d = 0, b = 0; 8 > b; b++) {
                this.makeImpl(!0, b);
                var c = m.getLostPoint(this);
                if (0 == b || a > c)a = c, d = b
            }
            return d
        }, createMovieClip: function (a, d, b) {
            a = a.createEmptyMovieClip(d, b);
            this.make();
            for (d = 0; d < this.modules.length; d++) {
                b = 1 * d;
                for (var c = 0; c < this.modules[d].length; c++) {
                    var e = 1 * c;
                    this.modules[d][c] && (a.beginFill(0, 100), a.moveTo(e, b), a.lineTo(e + 1, b), a.lineTo(e + 1, b + 1), a.lineTo(e, b + 1), a.endFill())
                }
            }
            return a
        }, setupTimingPattern: function () {
            for (var a = 8; a < this.moduleCount - 8; a++)null == this.modules[a][6] && (this.modules[a][6] =
                0 == a % 2);
            for (a = 8; a < this.moduleCount - 8; a++)null == this.modules[6][a] && (this.modules[6][a] = 0 == a % 2)
        }, setupPositionAdjustPattern: function () {
            for (var a = m.getPatternPosition(this.typeNumber), d = 0; d < a.length; d++)for (var b = 0; b < a.length; b++) {
                var c = a[d], e = a[b];
                if (null == this.modules[c][e])for (var g = -2; 2 >= g; g++)for (var q = -2; 2 >= q; q++)-2 == g || 2 == g || -2 == q || 2 == q || 0 == g && 0 == q ? this.modules[c + g][e + q] = !0 : this.modules[c + g][e + q] = !1
            }
        }, setupTypeNumber: function (a) {
            for (var d = m.getBCHTypeNumber(this.typeNumber), b = 0; 18 > b; b++) {
                var c =
                    !a && 1 == (d >> b & 1);
                this.modules[Math.floor(b / 3)][b % 3 + this.moduleCount - 8 - 3] = c
            }
            for (b = 0; 18 > b; b++)c = !a && 1 == (d >> b & 1), this.modules[b % 3 + this.moduleCount - 8 - 3][Math.floor(b / 3)] = c
        }, setupTypeInfo: function (a, d) {
            for (var b = m.getBCHTypeInfo(this.errorCorrectLevel << 3 | d), c = 0; 15 > c; c++) {
                var e = !a && 1 == (b >> c & 1);
                6 > c ? this.modules[c][8] = e : 8 > c ? this.modules[c + 1][8] = e : this.modules[this.moduleCount - 15 + c][8] = e
            }
            for (c = 0; 15 > c; c++)e = !a && 1 == (b >> c & 1), 8 > c ? this.modules[8][this.moduleCount - c - 1] = e : 9 > c ? this.modules[8][15 - c - 1 + 1] = e : this.modules[8][15 -
            c - 1] = e;
            this.modules[this.moduleCount - 8][8] = !a
        }, mapData: function (a, d) {
            for (var b = -1, c = this.moduleCount - 1, e = 7, g = 0, q = this.moduleCount - 1; 0 < q; q -= 2)for (6 == q && q--; ;) {
                for (var h = 0; 2 > h; h++)if (null == this.modules[c][q - h]) {
                    var u = !1;
                    g < a.length && (u = 1 == (a[g] >>> e & 1));
                    m.getMask(d, c, q - h) && (u = !u);
                    this.modules[c][q - h] = u;
                    e--;
                    -1 == e && (g++, e = 7)
                }
                c += b;
                if (0 > c || this.moduleCount <= c) {
                    c -= b;
                    b = -b;
                    break
                }
            }
        }
    };
    f.PAD0 = 236;
    f.PAD1 = 17;
    f.createData = function (a, d, b) {
        d = v.getRSBlocks(a, d);
        for (var c = new y, e = 0; e < b.length; e++) {
            var g = b[e];
            c.put(g.mode,
                4);
            c.put(g.getLength(), m.getLengthInBits(g.mode, a));
            g.write(c)
        }
        for (e = a = 0; e < d.length; e++)a += d[e].dataCount;
        if (c.getLengthInBits() > 8 * a)throw Error("code length overflow. (" + c.getLengthInBits() + ">" + 8 * a + ")");
        for (c.getLengthInBits() + 4 <= 8 * a && c.put(0, 4); 0 != c.getLengthInBits() % 8;)c.putBit(!1);
        for (; !(c.getLengthInBits() >= 8 * a);) {
            c.put(f.PAD0, 8);
            if (c.getLengthInBits() >= 8 * a)break;
            c.put(f.PAD1, 8)
        }
        return f.createBytes(c, d)
    };
    f.createBytes = function (a, d) {
        for (var b = 0, c = 0, e = 0, g = Array(d.length), q = Array(d.length), h = 0; h <
        d.length; h++) {
            var u = d[h].dataCount, f = d[h].totalCount - u, c = Math.max(c, u), e = Math.max(e, f);
            g[h] = Array(u);
            for (var n = 0; n < g[h].length; n++)g[h][n] = 255 & a.buffer[n + b];
            b += u;
            n = m.getErrorCorrectPolynomial(f);
            u = (new k(g[h], n.getLength() - 1)).mod(n);
            q[h] = Array(n.getLength() - 1);
            for (n = 0; n < q[h].length; n++)f = n + u.getLength() - q[h].length, q[h][n] = 0 <= f ? u.get(f) : 0
        }
        for (n = h = 0; n < d.length; n++)h += d[n].totalCount;
        b = Array(h);
        for (n = u = 0; n < c; n++)for (h = 0; h < d.length; h++)n < g[h].length && (b[u++] = g[h][n]);
        for (n = 0; n < e; n++)for (h = 0; h < d.length; h++)n <
        q[h].length && (b[u++] = q[h][n]);
        return b
    };
    for (var t = {MODE_NUMBER: 1, MODE_ALPHA_NUM: 2, MODE_8BIT_BYTE: 4, MODE_KANJI: 8}, w = {
        L: 1,
        M: 0,
        Q: 3,
        H: 2
    }, m = {
        PATTERN_POSITION_TABLE: [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30,
            54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]],
        G15: 1335,
        G18: 7973,
        G15_MASK: 21522,
        getBCHTypeInfo: function (a) {
            for (var d = a << 10; 0 <= m.getBCHDigit(d) - m.getBCHDigit(m.G15);)d ^= m.G15 << m.getBCHDigit(d) - m.getBCHDigit(m.G15);
            return (a << 10 | d) ^ m.G15_MASK
        },
        getBCHTypeNumber: function (a) {
            for (var d =
                a << 12; 0 <= m.getBCHDigit(d) - m.getBCHDigit(m.G18);)d ^= m.G18 << m.getBCHDigit(d) - m.getBCHDigit(m.G18);
            return a << 12 | d
        },
        getBCHDigit: function (a) {
            for (var d = 0; 0 != a;)d++, a >>>= 1;
            return d
        },
        getPatternPosition: function (a) {
            return m.PATTERN_POSITION_TABLE[a - 1]
        },
        getMask: function (a, d, b) {
            switch (a) {
                case 0:
                    return 0 == (d + b) % 2;
                case 1:
                    return 0 == d % 2;
                case 2:
                    return 0 == b % 3;
                case 3:
                    return 0 == (d + b) % 3;
                case 4:
                    return 0 == (Math.floor(d / 2) + Math.floor(b / 3)) % 2;
                case 5:
                    return 0 == d * b % 2 + d * b % 3;
                case 6:
                    return 0 == (d * b % 2 + d * b % 3) % 2;
                case 7:
                    return 0 ==
                        (d * b % 3 + (d + b) % 2) % 2;
                default:
                    throw Error("bad maskPattern:" + a);
            }
        },
        getErrorCorrectPolynomial: function (a) {
            for (var d = new k([1], 0), b = 0; b < a; b++)d = d.multiply(new k([1, p.gexp(b)], 0));
            return d
        },
        getLengthInBits: function (a, d) {
            if (1 <= d && 10 > d)switch (a) {
                case t.MODE_NUMBER:
                    return 10;
                case t.MODE_ALPHA_NUM:
                    return 9;
                case t.MODE_8BIT_BYTE:
                    return 8;
                case t.MODE_KANJI:
                    return 8;
                default:
                    throw Error("mode:" + a);
            } else if (27 > d)switch (a) {
                case t.MODE_NUMBER:
                    return 12;
                case t.MODE_ALPHA_NUM:
                    return 11;
                case t.MODE_8BIT_BYTE:
                    return 16;
                case t.MODE_KANJI:
                    return 10;
                default:
                    throw Error("mode:" + a);
            } else {
                if (!(41 > d))throw Error("type:" + d);
                switch (a) {
                    case t.MODE_NUMBER:
                        return 14;
                    case t.MODE_ALPHA_NUM:
                        return 13;
                    case t.MODE_8BIT_BYTE:
                        return 16;
                    case t.MODE_KANJI:
                        return 12;
                    default:
                        throw Error("mode:" + a);
                }
            }
        },
        getLostPoint: function (a) {
            for (var d = a.getModuleCount(), b = 0, c = 0; c < d; c++)for (var e = 0; e < d; e++) {
                for (var g = 0, q = a.isDark(c, e), h = -1; 1 >= h; h++)if (!(0 > c + h || d <= c + h))for (var f = -1; 1 >= f; f++)0 > e + f || d <= e + f || 0 == h && 0 == f || q != a.isDark(c + h, e + f) || g++;
                5 < g && (b +=
                    3 + g - 5)
            }
            for (c = 0; c < d - 1; c++)for (e = 0; e < d - 1; e++)if (g = 0, a.isDark(c, e) && g++, a.isDark(c + 1, e) && g++, a.isDark(c, e + 1) && g++, a.isDark(c + 1, e + 1) && g++, 0 == g || 4 == g)b += 3;
            for (c = 0; c < d; c++)for (e = 0; e < d - 6; e++)a.isDark(c, e) && !a.isDark(c, e + 1) && a.isDark(c, e + 2) && a.isDark(c, e + 3) && a.isDark(c, e + 4) && !a.isDark(c, e + 5) && a.isDark(c, e + 6) && (b += 40);
            for (e = 0; e < d; e++)for (c = 0; c < d - 6; c++)a.isDark(c, e) && !a.isDark(c + 1, e) && a.isDark(c + 2, e) && a.isDark(c + 3, e) && a.isDark(c + 4, e) && !a.isDark(c + 5, e) && a.isDark(c + 6, e) && (b += 40);
            for (e = g = 0; e < d; e++)for (c = 0; c < d; c++)a.isDark(c,
                e) && g++;
            return b += Math.abs(100 * g / d / d - 50) / 5 * 10, b
        }
    }, p = {
        glog: function (a) {
            if (1 > a)throw Error("glog(" + a + ")");
            return p.LOG_TABLE[a]
        }, gexp: function (a) {
            for (; 0 > a;)a += 255;
            for (; 256 <= a;)a -= 255;
            return p.EXP_TABLE[a]
        }, EXP_TABLE: Array(256), LOG_TABLE: Array(256)
    }, r = 0; 8 > r; r++)p.EXP_TABLE[r] = 1 << r;
    for (r = 8; 256 > r; r++)p.EXP_TABLE[r] = p.EXP_TABLE[r - 4] ^ p.EXP_TABLE[r - 5] ^ p.EXP_TABLE[r - 6] ^ p.EXP_TABLE[r - 8];
    for (r = 0; 255 > r; r++)p.LOG_TABLE[p.EXP_TABLE[r]] = r;
    k.prototype = {
        get: function (a) {
            return this.num[a]
        }, getLength: function () {
            return this.num.length
        },
        multiply: function (a) {
            for (var d = Array(this.getLength() + a.getLength() - 1), b = 0; b < this.getLength(); b++)for (var c = 0; c < a.getLength(); c++)d[b + c] ^= p.gexp(p.glog(this.get(b)) + p.glog(a.get(c)));
            return new k(d, 0)
        }, mod: function (a) {
            if (0 > this.getLength() - a.getLength())return this;
            for (var d = p.glog(this.get(0)) - p.glog(a.get(0)), b = Array(this.getLength()), c = 0; c < this.getLength(); c++)b[c] = this.get(c);
            for (c = 0; c < a.getLength(); c++)b[c] ^= p.gexp(p.glog(a.get(c)) + d);
            return (new k(b, 0)).mod(a)
        }
    };
    v.RS_BLOCK_TABLE = [[1, 26, 19], [1,
        26, 16], [1, 26, 13], [1, 26, 9], [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16], [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13], [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9], [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12], [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15], [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14], [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15], [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13], [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
        [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13], [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15], [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12], [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13], [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12], [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16], [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43,
            15], [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15], [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14], [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16], [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17], [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13], [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16], [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11,
            54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17], [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16], [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17], [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16], [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16], [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16], [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23,
            45, 15, 25, 46, 16], [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16], [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16], [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16], [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17], [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16], [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16], [17,
            152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16], [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16], [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16], [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]];
    v.getRSBlocks = function (a, d) {
        var b = v.getRsBlockTable(a, d);
        if (void 0 == b)throw Error("bad rs block @ typeNumber:" + a + "/errorCorrectLevel:" + d);
        for (var c = b.length / 3, e = [], g = 0; g < c; g++)for (var f =
            b[3 * g + 0], h = b[3 * g + 1], u = b[3 * g + 2], k = 0; k < f; k++)e.push(new v(h, u));
        return e
    };
    v.getRsBlockTable = function (a, d) {
        switch (d) {
            case w.L:
                return v.RS_BLOCK_TABLE[4 * (a - 1) + 0];
            case w.M:
                return v.RS_BLOCK_TABLE[4 * (a - 1) + 1];
            case w.Q:
                return v.RS_BLOCK_TABLE[4 * (a - 1) + 2];
            case w.H:
                return v.RS_BLOCK_TABLE[4 * (a - 1) + 3]
        }
    };
    y.prototype = {
        get: function (a) {
            return 1 == (this.buffer[Math.floor(a / 8)] >>> 7 - a % 8 & 1)
        }, put: function (a, d) {
            for (var b = 0; b < d; b++)this.putBit(1 == (a >>> d - b - 1 & 1))
        }, getLengthInBits: function () {
            return this.length
        }, putBit: function (a) {
            var d =
                Math.floor(this.length / 8);
            this.buffer.length <= d && this.buffer.push(0);
            a && (this.buffer[d] |= 128 >>> this.length % 8);
            this.length++
        }
    };
    var x = [[17, 14, 11, 7], [32, 26, 20, 14], [53, 42, 32, 24], [78, 62, 46, 34], [106, 84, 60, 44], [134, 106, 74, 58], [154, 122, 86, 64], [192, 152, 108, 84], [230, 180, 130, 98], [271, 213, 151, 119], [321, 251, 177, 137], [367, 287, 203, 155], [425, 331, 241, 177], [458, 362, 258, 194], [520, 412, 292, 220], [586, 450, 322, 250], [644, 504, 364, 280], [718, 560, 394, 310], [792, 624, 442, 338], [858, 666, 482, 382], [929, 711, 509, 403], [1003, 779, 565, 439],
        [1091, 857, 611, 461], [1171, 911, 661, 511], [1273, 997, 715, 535], [1367, 1059, 751, 593], [1465, 1125, 805, 625], [1528, 1190, 868, 658], [1628, 1264, 908, 698], [1732, 1370, 982, 742], [1840, 1452, 1030, 790], [1952, 1538, 1112, 842], [2068, 1628, 1168, 898], [2188, 1722, 1228, 958], [2303, 1809, 1283, 983], [2431, 1911, 1351, 1051], [2563, 1989, 1423, 1093], [2699, 2099, 1499, 1139], [2809, 2213, 1579, 1219], [2953, 2331, 1663, 1273]], r = function () {
        var a = function (a, b) {
            this._el = a;
            this._htOption = b
        };
        a.prototype.draw = function (a) {
            function b(a, c) {
                var b = document.createElementNS("http://www.w3.org/2000/svg",
                    a), d;
                for (d in c)c.hasOwnProperty(d) && b.setAttribute(d, c[d]);
                return b
            }

            var c = this._htOption, e = this._el, g = a.getModuleCount();
            this.clear();
            var f = b("svg", {
                viewBox: "0 0 " + String(g) + " " + String(g),
                width: "100%",
                height: "100%",
                fill: c.colorLight
            });
            f.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
            e.appendChild(f);
            f.appendChild(b("rect", {fill: c.colorDark, width: "1", height: "1", id: "template"}));
            for (c = 0; c < g; c++)for (e = 0; e < g; e++)if (a.isDark(c, e)) {
                var h = b("use", {
                    x: String(c),
                    y: String(e)
                });
                h.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#template");
                f.appendChild(h)
            }
        };
        a.prototype.clear = function () {
            for (; this._el.hasChildNodes();)this._el.removeChild(this._el.lastChild)
        };
        return a
    }(), A = "svg" === document.documentElement.tagName.toLowerCase() ? r : "undefined" == typeof CanvasRenderingContext2D ? function () {
        var a = function (a, b) {
            this._el = a;
            this._htOption = b
        };
        a.prototype.draw = function (a) {
            for (var b = this._htOption, c = this._el, e = a.getModuleCount(), g = Math.floor(b.width / e), f = Math.floor(b.height /
                e), h = ['<table style="border:0;border-collapse:collapse;">'], k = 0; k < e; k++) {
                h.push("<tr>");
                for (var l = 0; l < e; l++)h.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:' + g + "px;height:" + f + "px;background-color:" + (a.isDark(k, l) ? b.colorDark : b.colorLight) + ';"></td>');
                h.push("</tr>")
            }
            h.push("</table>");
            c.innerHTML = h.join("");
            a = c.childNodes[0];
            c = (b.width - a.offsetWidth) / 2;
            b = (b.height - a.offsetHeight) / 2;
            0 < c && 0 < b && (a.style.margin = b + "px " + c + "px")
        };
        a.prototype.clear = function () {
            this._el.innerHTML =
                ""
        };
        return a
    }() : function () {
        function a() {
            this._elImage.src = this._elCanvas.toDataURL("image/png");
            this._elImage.style.display = "block";
            this._elCanvas.style.display = "none"
        }

        function d(a, c) {
            var b = this;
            b._fFail = c;
            b._fSuccess = a;
            if (null === b._bSupportDataURI) {
                var d = document.createElement("img"), e = function () {
                    b._bSupportDataURI = !1;
                    b._fFail && _fFail.call(b)
                };
                d.onabort = e;
                d.onerror = e;
                d.onload = function () {
                    b._bSupportDataURI = !0;
                    b._fSuccess && b._fSuccess.call(b)
                };
                d.src = "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="
            } else!0 ===
            b._bSupportDataURI && b._fSuccess ? b._fSuccess.call(b) : !1 === b._bSupportDataURI && b._fFail && b._fFail.call(b)
        }

        if (this._android && 2.1 >= this._android) {
            var b = 1 / window.devicePixelRatio, c = CanvasRenderingContext2D.prototype.drawImage;
            CanvasRenderingContext2D.prototype.drawImage = function (a, d, e, f, k, n, l, m, r) {
                if ("nodeName" in a && /img/i.test(a.nodeName))for (var p = arguments.length - 1; 1 <= p; p--)arguments[p] *= b; else"undefined" == typeof m && (arguments[1] *= b, arguments[2] *= b, arguments[3] *= b, arguments[4] *= b);
                c.apply(this, arguments)
            }
        }
        var e =
            function (a, b) {
                this._bIsPainted = !1;
                this._android = z();
                this._htOption = b;
                this._elCanvas = document.createElement("canvas");
                this._elCanvas.width = b.width;
                this._elCanvas.height = b.height;
                a.appendChild(this._elCanvas);
                this._el = a;
                this._oContext = this._elCanvas.getContext("2d");
                this._bIsPainted = !1;
                this._elImage = document.createElement("img");
                this._elImage.alt = "Scan me!";
                this._elImage.style.display = "none";
                this._el.appendChild(this._elImage);
                this._bSupportDataURI = null
            };
        e.prototype.draw = function (a) {
            var b = this._elImage,
                c = this._oContext, d = this._htOption, e = a.getModuleCount(), f = d.width / e, k = d.height / e, l = Math.round(f), m = Math.round(k);
            b.style.display = "none";
            this.clear();
            for (b = 0; b < e; b++)for (var p = 0; p < e; p++) {
                var r = a.isDark(b, p), t = p * f, v = b * k;
                c.strokeStyle = r ? d.colorDark : d.colorLight;
                c.lineWidth = 1;
                c.fillStyle = r ? d.colorDark : d.colorLight;
                c.fillRect(t, v, f, k);
                c.strokeRect(Math.floor(t) + .5, Math.floor(v) + .5, l, m);
                c.strokeRect(Math.ceil(t) - .5, Math.ceil(v) - .5, l, m)
            }
            this._bIsPainted = !0
        };
        e.prototype.makeImage = function () {
            this._bIsPainted &&
            d.call(this, a)
        };
        e.prototype.isPainted = function () {
            return this._bIsPainted
        };
        e.prototype.clear = function () {
            this._oContext.clearRect(0, 0, this._elCanvas.width, this._elCanvas.height);
            this._bIsPainted = !1
        };
        e.prototype.round = function (a) {
            return a ? Math.floor(1E3 * a) / 1E3 : a
        };
        return e
    }();
    QRCode = function (a, d) {
        this._htOption = {
            width: 256,
            height: 256,
            typeNumber: 4,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: w.H
        };
        "string" === typeof d && (d = {text: d});
        if (d)for (var b in d)this._htOption[b] = d[b];
        "string" == typeof a && (a =
            document.getElementById(a));
        this._android = z();
        this._el = a;
        this._oQRCode = null;
        this._oDrawing = new A(this._el, this._htOption);
        this._htOption.text && this.makeCode(this._htOption.text)
    };
    QRCode.prototype.makeCode = function (a) {
        var d = this._htOption.correctLevel, b = 1, c;
        c = encodeURI(a).toString().replace(/\%[0-9a-fA-F]{2}/g, "a");
        c = c.length + (c.length != a ? 3 : 0);
        for (var e = 0, g = x.length; e <= g; e++) {
            var k = 0;
            switch (d) {
                case w.L:
                    k = x[e][0];
                    break;
                case w.M:
                    k = x[e][1];
                    break;
                case w.Q:
                    k = x[e][2];
                    break;
                case w.H:
                    k = x[e][3]
            }
            if (c <= k)break;
            else b++
        }
        if (b > x.length)throw Error("Too long data");
        this._oQRCode = new f(b, this._htOption.correctLevel);
        this._oQRCode.addData(a);
        this._oQRCode.make();
        this._el.title = a;
        this._oDrawing.draw(this._oQRCode);
        this.makeImage()
    };
    QRCode.prototype.makeImage = function () {
        "function" == typeof this._oDrawing.makeImage && (!this._android || 3 <= this._android) && this._oDrawing.makeImage()
    };
    QRCode.prototype.clear = function () {
        this._oDrawing.clear()
    };
    QRCode.CorrectLevel = w
})();
var jsonpId = 1E4;
(function () {
    JSAPI = {
        queryCount: 0, opt: {target: null, appId: "", shopId: "", extend: "", authUrl: ""}, auth: function (l) {
            for (var f in l)this.opt[f] = l[f];
            this.opt.appId ? this.opt.shopId ? this.opt.authUrl ? (l = this.genTicket(), this.genQrCode("http://mp.weixin.qq.com/mp/wifi?q=pc&appid=" + this.opt.appId + "&shopid=" + this.opt.shopId + "&ticket=" + l), this.queryState(l)) : alert("authUrl \u4e0d\u80fd\u4e3a\u7a7a") : alert("shopId \u4e0d\u80fd\u4e3a\u7a7a") : alert("appId \u4e0d\u80fd\u4e3a\u7a7a")
        }, genTicket: function () {
            return this.genHashCode(this.opt.appId +
                    this.opt.shopId) + Math.random().toString(36).substr(2)
        }, genHashCode: function (l) {
            for (var f = 0, k = 0; k < l.length; k++)if (f = 31 * f + l.charCodeAt(k), 2147483647 < f || -2147483648 > f)f &= 4294967295;
            return 0 <= f ? f : -f
        }, genQrCode: function (l) {
            var f = this.opt.target;
            f || (f = document.createElement("DIV"), f.innerHTML = '<div style="position:fixed;opacity:.75;width:100%;height:100%;top:0;left:0;z-index:99999;"></div><div id="weixin_wifi_auth_qrcode" style="position:fixed;z-index:100000;left:50%;top:50%;margin-left:-175px;margin-top:-175px;"></div><div style="position:fixed;z-index:100000;background-color:#FFF;top:50%;left:50%;margin-left:-175px;margin-top:175px;font-size:18px;width:340px;text-align:center;padding: 5px;">\u8bf7\u7528\u5fae\u4fe1\u626b\u63cf\u4e8c\u7ef4\u7801</div>',
                document.body.appendChild(f), f = document.getElementById("weixin_wifi_auth_qrcode"));
            /(\d+)/.test(f.style.width);
            var k = RegExp.$1;
            if (200 > k || 400 < k)k = 350;
            k -= 10;
            f.style.position && "static" != f.style.position && "inherit" != f.style.position || (f.style.position = "relative");
            f.innerHTML = '<img style="width:50px;position:absolute;z-index:1;top:50%;left:50%;margin-top:-25px;margin-left:-22px;background-color:#FFF;" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABQCAYAAACZM2JkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NzQ0QTA3Qjk2RkJBMTFFNEJCMEZDQzc4NzdCOUExOEEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NzQ0QTA3QkE2RkJBMTFFNEJCMEZDQzc4NzdCOUExOEEiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo3NDRBMDdCNzZGQkExMUU0QkIwRkNDNzg3N0I5QTE4QSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo3NDRBMDdCODZGQkExMUU0QkIwRkNDNzg3N0I5QTE4QSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Po2Ln3EAAAkeSURBVHja7F0HjBVF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" /><div id="weixin_wifi_qrcode_timeout" style="display:none;position:absolute;z-index:1;background-color:#000;opacity:.8;width:' +
                k + "px;height:" + k + 'px;text-align:center;font-size:26px;color:#FFF;"><div id="weixin_wifi_error_tips" style="margin-top:' + (k - 52) / 2 + 'px;">\u4e8c\u7ef4\u7801\u5931\u6548<br/>\u8bf7\u5237\u65b0\u91cd\u8bd5</div></div>';
            (new QRCode(f, {width: k, height: k})).makeCode(l)
        }, queryState: function (l) {
            var f = this;
            this.queryCount++;
            1 == this.queryCount && (qrcodeQueryTimeout = new Date, qrcodeCheckNetTimeout = setTimeout(function () {
                document.getElementById("weixin_wifi_error_tips").innerHTML = "\u670d\u52a1\u5668\u7e41\u5fd9<br/>\u8bf7\u4e00\u5206\u949f\u540e\u5237\u65b0\u91cd\u8bd5";
                document.getElementById("weixin_wifi_qrcode_timeout").style.display = "block"
            }, 30001));
            this.jsonp("https://wifi.weixin.qq.com/cgi-bin/pollpcresult?ticket=" + l, function (k) {
                clearTimeout(qrcodeCheckNetTimeout);
                1 == k.success ? f.gotoAuth(k.data) : 12E4 < (new Date).getTime() - qrcodeQueryTimeout.getTime() ? document.getElementById("weixin_wifi_qrcode_timeout").style.display = "block" : f.queryState(l)
            })
        }, gotoAuth: function (l) {
            -1 != this.opt.authUrl.indexOf("?") ? window.location = this.opt.authUrl + "&" + l + "&extend=" + encodeURIComponent(this.opt.extend) :
                window.location = this.opt.authUrl + "?" + l + "&extend=" + encodeURIComponent(this.opt.extend)
        }, jsonp: function (l, f) {
            jsonpId++;
            var k = "callback" + jsonpId;
            window[k] = f;
            l = -1 != l.indexOf("?") ? l + ("&callback=" + k) : l + ("?callback=" + k);
            k = document.createElement("script");
            k.setAttribute("src", l);
            document.getElementsByTagName("head")[0].appendChild(k)
        }
    }
})();