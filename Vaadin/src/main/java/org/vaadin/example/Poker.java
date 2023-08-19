package org.vaadin.example;

import java.util.ArrayList;

import org.vaadin.example.helpers.Card;
import org.vaadin.example.helpers.Hand;
import org.vaadin.example.helpers.HandController;
import org.vaadin.example.helpers.Card.Suit;

public class Poker {

    private int winner;

    private Hand dealerHand;
    private Hand playerHand;

    public Poker(String first, String second) {
        int firstRank = Integer.valueOf(first.charAt(1));
        char firstSuit = first.charAt(2);

        int secondRank = Integer.valueOf(first.charAt(1));
        char secondSuit = first.charAt(2);

        Card firstCard = new Card();
        switch (firstSuit) {
            case 's':
                firstCard = new Card(firstRank, Suit.SPADES);
                break;
            case 'c':
                firstCard = new Card(firstRank, Suit.CLUBS);
                break;
            case 'd':
                firstCard = new Card(firstRank, Suit.DIAMONDS);
                break;

            case 'h':
                firstCard = new Card(firstRank, Suit.HEARTS);
                break;
            default:
                break;
        }

        Card secondCard = new Card();
        switch (secondSuit) {
            case 's':
                secondCard = new Card(secondRank, Suit.SPADES);
                break;
            case 'c':
                secondCard = new Card(secondRank, Suit.CLUBS);
                break;
            case 'd':
                secondCard = new Card(secondRank, Suit.DIAMONDS);
                break;

            case 'h':
                firstCard = new Card(secondRank, Suit.HEARTS);
                break;
            default:
                break;
        }

        ArrayList<Card> firstCards = new ArrayList<Card>();
        ArrayList<Card> secondCards = new ArrayList<Card>() {

            {
                add(new Card(2, Suit.SPADES));
                add(new Card(3, Suit.SPADES));
                add(new Card(4, Suit.SPADES));
                add(new Card(5, Suit.SPADES));
                add(new Card(6, Suit.SPADES));
                add(new Card(2, Suit.CLUBS));
                add(new Card(3, Suit.DIAMONDS));
            }
        };
        for (int i = 0; i < 7; i++) {
            firstCards.add(firstCard);
            // secondCards.add(secondCard);
        }
        dealerHand = new Hand(firstCards);

        playerHand = new Hand(secondCards);
    }

    public int getWinner() {

        HandController controller = new HandController();
        winner = controller.compareHands(dealerHand, playerHand);
        return winner;
    }
}