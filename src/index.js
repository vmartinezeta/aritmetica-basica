const Signo = {
    MENOS: -1,
    MAS: 1
}


class Fraccion {
    constructor(signo, numerador, denominador, visibleSignoMas) {
        this.signo = signo;
        this.numerador = numerador;
        this.denominador = denominador;
        this.visibleSignoMas = visibleSignoMas || true;
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
        return new Fraccion(this.signo, this.numerador / maxcd, this.denominador / maxcd);
    }

    newInstance() {
        return new Fraccion(this.signo, this.numerador, this.denominador);
    }

}


class ExpresionAritmetica {
    constructor(...terminos) {
        this.terminos = terminos || [];
    }

    addNumero(numero) {
        this.terminos.push(new Fraccion(Signo.MAS, numero, 1));
        return this;
    }

    addFraccion(fraccion) {
        this.terminos.push(fraccion);
        return this;
    }

    addParentesis(signo, expresion) {
        this.terminos.push(new ExpresionConParentesis(signo, expresion));
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
        return this.terminos.reduce((text, termino)=> {
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
        fr.tomarSigno();
        return new Fraccion(fr.signo*this.signo, fr.numerador, fr.denominador);
    }

    toString() {
        if (this.signo === Signo.MAS && this.visibleSignoMas) {
            return `+ ${this.expresion.toString()}`;
        } else if (this.signo === Signo.MAS) {
            return this.expresion.toString();
        }
        return `- ${this.expresion.toString()}`;
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
        return this.expresion.reducir();
    }

}


const expresion = new ExpresionAritmetica();
expresion.addNumero(2)
    .addFraccion(new Fraccion(Signo.MENOS, 7, 3))
    .addFraccion(new Fraccion(Signo.MAS, 5, 6));

const calculadora = new Calculadora(expresion);
const fraccion = calculadora.resolver();
fraccion.visibleSignoMas = false;
const nuevaFraccion = fraccion.simplificar();
nuevaFraccion.visibleSignoMas = false;
console.log(expresion.toString());
console.log(fraccion.toString());
console.log(nuevaFraccion.toString());