# pklib [![Build Status](https://secure.travis-ci.org/piecioshka/pklib.png?branch=master)](http://travis-ci.org/piecioshka/pklib)

`pklib` jest wynikiem ciągłego używania z tych samych wzorców w sieci web,<br />
z dodatkiem ogromu przydatnych metod używanych na co dzień w naszych projektach.<br /> 

Przykład:<br />
    moduł `pklib.profiler`<br />
    plik: `src/profiler.js`

Biblioteka posiada testy jednostkowe napisane zgodnie ze specyfikacją [QUnit](http://docs.jquery.com/Qunit) + Composite


## budowa biblioteki

Każda wersja posiada własny tag w gałęzi projektu. Dla poprawy pracy nad biblioteką został napisany skrypt w bashu,
który ma za zadanie generować kod całej biblioteki z aktualnego katalogu w jeden duży plik. <br />
Każdy tag ma w swoich żródłach juz wygenerowany plik z kodem źródłowym biblioteki, ale gdy istniała potrzeba 
wygenerowanie biblioteki z aktualnych źródeł dostępnych w branch'ach plik **Makefile**, bo o nim mowa,
znajduje swoje praktyczne zastosowanie.

`username:~/workspace/pklib$ ./Makefile`

## dokumentacja

Dokumentacja została wygenerowana za pomoca narzędzia [http://code.google.com/p/jsdoc-toolkit/](http://code.google.com/p/jsdoc-toolkit/).<br />
Adres do dokumentacji online: [http://docs.pklib.com](http://docs.pklib.com)

## przykład użycia

```
pklib.common.defer(function () {
    var filenames = ["test.js", "example.js"];
    pklib.file.loadjs(filenames, function (file) {
        console.log("file: " + file.src + " loaded");
    });
});
```

## licencja

GPL 3.0 License ( [http://www.gnu.org/licenses/gpl-3.0.txt](http://www.gnu.org/licenses/gpl-3.0.txt "GNU 3.0 License") )
