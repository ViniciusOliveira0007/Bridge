namespace Escola{
    class Aluno{
    private _nome:string;
    private _email:string;
    private _senha:string;

        get nome(){
            return this._nome
        }

        set nome(nome:string){
            this._nome= nome;
        }


    }
}