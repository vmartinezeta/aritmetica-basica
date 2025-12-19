const Signo = {
    MENOS: -1,
    MAS: 1
}

class Fraccion {
    constructor(signo, numerador, denominador, visibleSignoMas) {
        this.signo = signo;
        this.numerador = numerador;
        this.denominador = denominador;
        this.visibleSignoMas = visibleSignoMas ?? true;
    }

    tomarSigno() {
        const signoNumerador = this.numerador / Math.abs(this.numerador);
        const signoDenominador = this.denominador / Math.abs(this.denominador);
        const signo = signoNumerador * signoDenominador;
        this.numerador = signoNumerador * this.numerador;
        this.denominador = signoDenominador * this.denominador;
        this.signo *= signo;
    }

    toDecimal() {
        return this.numerador / this.denominador;
    }

    toString() {
        this.tomarSigno();
        if (this.signo === Signo.MAS && this.visibleSignoMas) {
            return `+ ${this.numerador} / ${this.denominador}`;
        } else if (this.signo === Signo.MAS) {
            return `${this.numerador} / ${this.denominador}`;
        }
        return `- ${this.numerador} / ${this.denominador}`;
    }

    simplificar() {
        this.tomarSigno();
        const maxcd = Factorizacion.maxcd(this.numerador, this.denominador);
        return new Fraccion(this.signo, this.numerador / maxcd, this.denominador / maxcd, this.visibleSignoMas);
    }

    newInstance() {
        return new Fraccion(this.signo, this.numerador, this.denominador, this.visibleSignoMas);
    }

}

class ExpresionAritmetica {
    constructor(...terminos) {
        this.terminos = terminos ?? [];
        this._terminos = this.terminos;
    }

    addNumero(numero) {
        this.terminos.push(new Fraccion(Signo.MAS, numero, 1));
        return this;
    }

    addFraccion(signo, numerador, denominador) {
        this.terminos.push(new Fraccion(signo, numerador, denominador));
        return this;
    }

    addParentesis(signo, subexpresion) {
        this.terminos.push(new ExpresionConParentesis(signo, subexpresion));
        this.terminos = this.terminos.map( termino => {
            if (termino instanceof ExpresionConParentesis) {
                return termino.reducir();
            }
            return termino;
        }).filter(termino => termino !== null);
        return this;
    }

    isFraccionHomogenea() {
        return this.terminos.map(f => f.newInstance()).map(fraccion => {
            fraccion.tomarSigno();
            return fraccion.denominador;
        }).every((denominador, _, array) => denominador === array[0]);
    }

    homogenizar() {
        const denominadores = this.terminos.map(fraccion => {
            fraccion.tomarSigno();
            return fraccion.denominador;
        });
        const mincm = Factorizacion.mincm(...denominadores);
        this.terminos = this.terminos.map(fraccion => {
            fraccion.tomarSigno();
            const numerador = fraccion.numerador * (mincm / fraccion.denominador);
            return new Fraccion(fraccion.signo, numerador, mincm);
        });
    }

    reducirHomogeneas() {
        return this.terminos.reduce((result, fraccion) => {
            if (!result) {
                fraccion.tomarSigno();
                return fraccion;
            }
            fraccion.tomarSigno();
            const numerador = result.signo * result.numerador + fraccion.signo * fraccion.numerador;
            if (!numerador) return null;
            return new Fraccion(Signo.MAS, numerador, result.denominador);
        }, null);
    }

    reducirHeterogeneas() {
        this.homogenizar();
        return this.reducirHomogeneas();
    }

    reducir() {
        if (this.isFraccionHomogenea()) {
            return this.reducirHomogeneas();
        }
        return this.reducirHeterogeneas();
    }

    toString() {
        return this._terminos.reduce((text, termino) => {
            if (!text) {
                termino.visibleSignoMas = false;
                return termino.toString();
            }
            return text + ' ' + termino.toString();
        }, null);
    }
}

class ExpresionConParentesis {
    constructor(signo, expresion, visibleSignoMas) {
        this.signo = signo;
        this.expresion = expresion;
        this.visibleSignoMas = visibleSignoMas || true;
    }

    reducir() {
        const fr = this.expresion.reducir();
        if (!fr) return null;
        fr.tomarSigno();
        return new Fraccion(fr.signo*this.signo, fr.numerador, fr.denominador);
    }

    toString() {
        if (this.signo === Signo.MAS && this.visibleSignoMas) {
            return `+ (${this.expresion.toString()})`;
        } else if (this.signo === Signo.MAS) {
            return `(${this.expresion.toString()})`;
        }
        return `- (${this.expresion.toString()})`;
    }
}

class Multiplicacion {
    constructor(...terminos) {
        this.terminos = terminos.map(t => {
            if (t instanceof Fraccion) {
                return t;
            }
            return new Fraccion(Signo.MAS, t, 1);
        });
    }

    multiplicar() {
        return this.terminos.reduce((producto, fraccion)=> {
            if (!producto) {
                fraccion.tomarSigno();
                return fraccion;
            }
            fraccion.tomarSigno();
            const signo = producto.signo * fraccion.signo;
            return new Fraccion(signo, producto.numerador*fraccion.numerador, producto.denominador*fraccion.denominador);
        }, null);
    }

    toString() {
        return this.terminos.reduce((result, termino)=> {
            if (!result) return termino.toString();
            return result.toString() + ' * ' + termino.toString();
        }, '');
    }

}

class Factorizacion {
    static maxcd(a, b) {
        let tabla = [a, b];
        let factorPrimo = 2;
        const factores = [];
        while (tabla.every(n => n >= factorPrimo)) {
            if (tabla.every(n => n % factorPrimo === 0)) {
                tabla = tabla.map(n => n / factorPrimo);
                factores.push(factorPrimo);
            } else if (factorPrimo === 2) {
                factorPrimo++;
            } else {
                factorPrimo += 2;
            }
        }

        return factores.reduce((producto, n) => producto * n, 1);
    }

    static mincm2(a, b) {
        let tabla = [a, b];
        let factorPrimo = 2;
        const factores = [];
        while (!tabla.every(n => n === 1)) {
            if (tabla.some(n => n % factorPrimo === 0)) {
                tabla = tabla.map(n => {
                    if (n % factorPrimo === 0) {
                        return n / factorPrimo;
                    }
                    return n;
                });
                factores.push(factorPrimo);
            } else if (factorPrimo === 2) {
                factorPrimo++;
            } else {
                factorPrimo += 2;
            }
        }
        return factores.reduce((producto, factor) => producto * factor, 1);
    }

    static mincm(...parametros) {
        return parametros.reduce((result, parametro) => this.mincm2(result, parametro), 1);
    }
}

class Calculadora {
    constructor(expresion) {
        this.expresion = expresion;
    }

    resolver() {
        const fraccion = this.expresion.reducir();
        fraccion.visibleSignoMas = false;
        const nuevaFraccion = fraccion.simplificar();
        console.log(expresion.toString(), ' = ', fraccion.toString(), ' = ', fraccion.toString()!== nuevaFraccion.toString() ? nuevaFraccion.toString():'');
    }

}

const expresion = new ExpresionAritmetica();

const subexpresion = new ExpresionAritmetica();
subexpresion.addFraccion(Signo.MAS, 1, 4)
            .addFraccion(Signo.MAS, 3, 10);

expresion.addNumero(2)
    .addFraccion(Signo.MENOS, 7, 3)
    .addFraccion(Signo.MAS, 5, 6)
    .addParentesis(Signo.MAS, subexpresion);

const calculadora = new Calculadora(expresion);
calculadora.resolver();