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

    mcd(a, b) {
        return b === 0 ? Math.abs(a) : this.mcd(b, a % b);
    }

    simplificar() {
        this.tomarSigno();
        const maxcd = this.mcd(this.numerador, this.denominador);
        return new Fraccion(this.signo, this.numerador / maxcd, this.denominador / maxcd, this.visibleSignoMas);
    }

    newInstance() {
        return new Fraccion(this.signo, this.numerador, this.denominador, this.visibleSignoMas);
    }

    sumar(otra) {
        this.tomarSigno();
        otra.tomarSigno();
        const numerador = this.signo*this.numerador+ otra.signo*otra.numerador;
        if (!numerador) return null;
        return new Fraccion(Signo.MAS, numerador, this.denominador);
    }
}


class Factorizacion {
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

class ExpresionAritmetica {
    constructor(parentExpresion, signo, visibleSignoMas) {
        this.parentExpresion = parentExpresion ?? null;
        this.signo = signo ?? Signo.MAS;
        this.visibleSignoMas = visibleSignoMas ?? true;
        this.terminos = [];
    }

    addNumero(numero) {
        this.terminos.push(new Fraccion(Signo.MAS, numero, 1));
        return this;
    }

    addFraccion(signo, numerador, denominador) {
        this.terminos.push(new Fraccion(signo, numerador, denominador));
        return this;
    }

    addParentesisCerrado() {
        return this.parentExpresion;
    }

    addParentesisAbierto(signo) {
        const subexpresion = new ExpresionAritmetica(this, signo);
        this.terminos.push(subexpresion);
        return subexpresion;
    }

    isFraccionHomogenea(terminos) {
        return terminos.map(fraccion => {
            fraccion.tomarSigno();
            return fraccion.denominador;
        }).every((denominador, _, array) => denominador === array[0]);
    }

    homogenizar(terminos) {
        const denominadores = terminos.map(fraccion => {
            fraccion.tomarSigno();
            return fraccion.denominador;
        });
        const mincm = Factorizacion.mincm(...denominadores);
        return terminos.map(fraccion => {
            fraccion.tomarSigno();
            const numerador = fraccion.numerador * (mincm / fraccion.denominador);
            return new Fraccion(fraccion.signo, numerador, mincm);
        });
    }

    reducirHomogeneas(terminos) {
        return terminos.reduce((result, fraccion) => {
            if (!result) {
                return fraccion;
            }
            return result.sumar(fraccion);
        }, null);
    }

    reducirHeterogeneas(terminos) {
        const nuevoTerminos = this.homogenizar(terminos);
        return this.reducirHomogeneas(nuevoTerminos);
    }

    eliminarParentesis(terminos) {
        return terminos.map(termino => {
            if (termino instanceof ExpresionAritmetica) {
                return termino.reducir();
            }
            return termino;
        });
    }

    reducir() {
        return this.reducirParcial(this.eliminarParentesis(this.terminos));
    }

    reducirParcial(terminos) {
        if (this.isFraccionHomogenea(terminos)) {
            return this.reducirHomogeneas(terminos);
        }
        return this.reducirHeterogeneas(terminos);
    }

    toString() {
        return this.terminos.reduce((text, termino) => {
            if (!text && termino instanceof Fraccion) {
                termino.visibleSignoMas = false;
                return termino.toString();
            } else if (!text && termino instanceof ExpresionAritmetica) {
                if (termino.signo === Signo.MAS) {
                    return `(${termino.toString()})`;
                }
                return `- (${termino.toString()})`;
            } else if (termino instanceof ExpresionAritmetica) {
                return `${text} ${termino.signo===Signo.MAS?'+':'-'} (${termino.toString()})`;
            }
            return text + ' ' + termino.toString();
        }, null);
    }

}

class Multiplicacion {
    constructor(parentExpresion) {
        this.parentExpresion = parentExpresion;
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

function crearExpresion() {
    return new ExpresionAritmetica();
}

const expresion = crearExpresion()
.addNumero(2)
.addFraccion(Signo.MENOS, 7, 3)
.addFraccion(Signo.MAS, 5, 6)


const calculadora = new Calculadora(expresion);
calculadora.resolver();